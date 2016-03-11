module.exports = function(io, targets) {
var config = require('nconf');
var kurento = require('kurento-client');
var logger = require('../common/logger');

/*
 * Definition of global variables
 */

var kurentoClient = null;
var userRegistry = new UserRegistry();
var pipelines = {};
var candidatesQueue = {};
var idCounter = 0;

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

/*
 * Definition of helper classes
 */

// Represents caller and callee sessions
function UserSession(id, name, ws) {
    this.id = id;
    this.name = name;
    this.ws = ws;
    this.peer = null;
    this.sdpOffer = null;
}
UserSession.prototype.sendMessage = function(message) {
    try {
        logger.debug('Connection ' + this.id + ' send message: ' + JSON.stringify(message));
        this.ws.send(JSON.stringify(message));
    }
    catch (exception) {
        return exception;
    }
};

// Represents registrar of users
function UserRegistry() {
    this.usersById = {};
    this.usersByName = {};
}
UserRegistry.prototype.register = function(user) {
    this.usersById[user.id] = user;
    this.usersByName[user.name] = user;
};
UserRegistry.prototype.unregister = function(id) {
    var user = this.getById(id);
    if (user) delete this.usersById[id];
    if (user && this.getByName(user.name)) delete this.usersByName[user.name];
};
UserRegistry.prototype.getById = function(id) {
    return this.usersById[id];
};
UserRegistry.prototype.getByName = function(name) {
    return this.usersByName[name];
};
UserRegistry.prototype.removeById = function(id) {
    var userSession = this.usersById[id];
    if (!userSession) return;
    delete this.usersById[id];
    delete this.usersByName[userSession.name];
};

// Represents a B2B active call
function CallMediaPipeline(record) {
    this.record = record;
    this.pipeline = null;
    this.webRtcEndpoint = {};
}
CallMediaPipeline.prototype.getRecorderParams = function(user) {
    var username = user.name || {};
    var recorderUri = config.get('recorder:uri');
    return {
        uri: recorderUri + Date.now() + '_' + username + '.webm',
        mediaProfile: ~username.indexOf('screen') ? 'WEBM_VIDEO_ONLY' : 'WEBM'
    };
};
CallMediaPipeline.prototype.setIceCandidate = function(webRtcEndpoint, user, onError) {
    if (candidatesQueue[user.id]) {
        while (candidatesQueue[user.id].length) {
            var candidate = candidatesQueue[user.id].shift();
            webRtcEndpoint.addIceCandidate(candidate);
        }
    }
    webRtcEndpoint.on('OnIceCandidate', function(event) {
        var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
        user.sendMessage({
            id: 'iceCandidate',
            candidate: candidate
        });
    });
};
CallMediaPipeline.prototype.createPipeline = function(caller, callee, callback) {
    var self = this;

    function onError(error) {
        self.release();
        return callback(error);
    }
    getKurentoClient(function(error, kurentoClient) {
        if (error) return callback(error);
        kurentoClient.create('MediaPipeline', function(error, pipeline) {
            if (error) return onError(error);
            if (self.record) {
                pipeline.create([{
                    type: 'RecorderEndpoint',
                    params: self.getRecorderParams(caller)
                }, {
                    type: 'WebRtcEndpoint',
                    params: {}
                }], function(error, elements) {
                    if (error) return onError(error);
                    var callerRecorder = elements[0];
                    var callerWebRtcEndpoint = elements[1];
                    self.setIceCandidate(callerWebRtcEndpoint, caller);
                    pipeline.create([{
                        type: 'RecorderEndpoint',
                        params: self.getRecorderParams(callee)
                    }, {
                        type: 'WebRtcEndpoint',
                        params: {}
                    }], function(error, elements) {
                        if (error) return onError(error);
                        var calleeRecorder = elements[0];
                        var calleeWebRtcEndpoint = elements[1];
                        self.setIceCandidate(calleeWebRtcEndpoint, callee);
                        callerWebRtcEndpoint.connect(callerRecorder, function(error) {
                            if (error) return onError(error);
                            calleeWebRtcEndpoint.connect(calleeRecorder, function(error) {
                                if (error) return onError(error);
                                callerWebRtcEndpoint.connect(calleeWebRtcEndpoint, function(error) {
                                    if (error) return onError(error);
                                    calleeWebRtcEndpoint.connect(callerWebRtcEndpoint, function(error) {
                                        if (error) return onError(error);
                                        callerRecorder.record(function(error) {
                                            if (error) return onError(error);
                                            calleeRecorder.record(function(error) {
                                                if (error) return onError(error);
                                                self.pipeline = pipeline;
                                                self.callerRecorder = callerRecorder;
                                                self.calleeRecorder = calleeRecorder;
                                                self.webRtcEndpoint[caller.id] = callerWebRtcEndpoint;
                                                self.webRtcEndpoint[callee.id] = calleeWebRtcEndpoint;
                                                callback();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
            else {
                pipeline.create([{
                    type: 'WebRtcEndpoint',
                    params: {}
                }], function(error, elements) {
                    if (error) return onError(error);
                    var callerWebRtcEndpoint = elements[0];
                    self.setIceCandidate(callerWebRtcEndpoint, caller);
                    callerWebRtcEndpoint.connect(callerWebRtcEndpoint, function(error) {
                        if (error) {
                            pipeline.release();
                            return callback(error);
                        }
                        self.pipeline = pipeline;
                        self.webRtcEndpoint[caller.id] = callerWebRtcEndpoint;
                        callback();
                    });
                });
            }
        });
    });
};
CallMediaPipeline.prototype.generateSdpAnswer = function(id, sdpOffer, callback) {
    this.webRtcEndpoint[id].processOffer(sdpOffer, callback);
    this.webRtcEndpoint[id].gatherCandidates(function(error) {
        if (error) {
            return callback(error);
        }
    });
};
CallMediaPipeline.prototype.release = function() {
    if (this.callerRecorder) this.callerRecorder.stop();
    if (this.calleeRecorder) this.calleeRecorder.stop();
    if (this.pipeline) this.pipeline.release();
    this.pipeline = null;
};

/*
 * Definition of functions
 */

// Bind socket
function bind(socket) {
    socket.on('connection', function(ws) {
        var sessionId = nextUniqueId();
        logger.debug('Connection received with sessionId ' + sessionId);
        ws.on('disconnect', function() {
            logger.debug('Connection ' + sessionId + ' closed');
            stop(sessionId);
            userRegistry.unregister(sessionId);
        });
        ws.on('message', function(_message) {
            var message = JSON.parse(_message);
            logger.debug('Connection ' + sessionId + ' received message: ' + JSON.stringify(message));
            switch (message.id) {
                case 'register':
                    sessionId = register(sessionId, message.name, ws);
                    break;
                case 'call':
                    call(sessionId, message.to, message.from, message.sdpOffer);
                    break;
                case 'incomingCallResponse':
                    incomingCallResponse(sessionId, message.from, message.callResponse, message.sdpOffer);
                    break;
                case 'stop':
                    stop(sessionId);
                    if (message.unregister) userRegistry.unregister(sessionId);
                    break;
                case 'onIceCandidate':
                    onIceCandidate(sessionId, message.candidate);
                    break;
                default:
                    ws.send(JSON.stringify({
                        id: 'error',
                        message: 'Invalid message ' + message
                    }));
                    break;
            }
        });
    });
}

// Register the username
function register(id, name, ws) {
    function onError(error) {
        logger.error("Error processing register: " + error);
        ws.send(JSON.stringify({
            id: 'registerResponse',
            response: 'rejected',
            message: error
        }));
    }
    if (!name) {
        return onError("empty user name");
    }
    var user = userRegistry.getByName(name);
    if (user) {
        user.ws = ws;
    }
    else {
        user = new UserSession(id, name, ws);
        userRegistry.register(user);
    }
    var message = {
        id: 'registerResponse',
        response: 'accepted'
    };
    user.sendMessage(message);
    return user.id;
}

// Make a call
function call(callerId, to, from, sdpOffer) {
    function onError(error) {
        var message = {
            id: 'callResponse',
            response: 'rejected',
            message: error
        };
        caller.sendMessage(message);
    }
    if (to == from) {
        return loopbackCallResponce(callerId, sdpOffer);
    }
    clearCandidatesQueue(callerId);
    var caller = userRegistry.getById(callerId);
    if (userRegistry.getByName(to)) {
        var callee = userRegistry.getByName(to);
        caller.sdpOffer = sdpOffer;
        callee.peer = from;
        caller.peer = to;
        var message = {
            id: 'incomingCall',
            from: from
        };
        var error = callee.sendMessage(message);
        if (error) return onError(error);
    }
    else {
        var error = 'User ' + to + ' is not registered';
        return onError(error);
    }
}

// Stop communication
function stop(sessionId) {
    var pipeline = pipelines[sessionId];
    if (pipeline) {
        delete pipelines[sessionId];
        pipeline.release();
    }
    var stopperUser = userRegistry.getById(sessionId);
    if (stopperUser) {
        var stoppedUser = userRegistry.getByName(stopperUser.peer);
        stopperUser.peer = null;
        if (stoppedUser) {
            stoppedUser.peer = null;
            delete pipelines[stoppedUser.id];
            var message = {
                id: 'stopCommunication',
                message: 'remote user hanged out'
            };
            stoppedUser.sendMessage(message);
        }
    }
    clearCandidatesQueue(sessionId);
}

// Loopback call responce
function loopbackCallResponce(callerId, sdpOffer) {
    function onError(error) {
        if (pipeline) pipeline.release();
        if (caller) {
            var callerMessage = {
                id: 'callResponse',
                response: 'rejected',
                message: error
            };
            caller.sendMessage(callerMessage);
        }
        if (error) logger.error('Pipeline error: ' + error);
    }
    clearCandidatesQueue(callerId);
    var caller = userRegistry.getById(callerId);
    var pipeline = new CallMediaPipeline();
    pipeline.createPipeline(caller, caller, function(error) {
        if (error) {
            return onError(error);
        }
        pipeline.generateSdpAnswer(caller.id, sdpOffer, function(error, callerSdpAnswer) {
            if (error) {
                return onError(error);
            }
            pipelines[caller.id] = pipeline;
            var message = {
                id: 'callResponse',
                response: 'accepted',
                sdpAnswer: callerSdpAnswer
            };
            caller.sendMessage(message);
        });
    });
}

// Incoming call response
function incomingCallResponse(calleeId, from, callResponse, calleeSdp) {
    function onError(callerReason, calleeReason) {
        if (pipeline) pipeline.release();
        if (caller) {
            var callerMessage = {
                id: 'callResponse',
                response: 'rejected',
                message: callerReason
            };
            caller.sendMessage(callerMessage);
        }
        if (callee) {
            var calleeMessage = {
                id: 'stopCommunication',
                message: calleeReason
            };
            callee.sendMessage(calleeMessage);
        }
        if (callerReason) logger.error('Pipeline error: ' + callerReason);
        if (calleeReason) logger.error('Pipeline error: ' + calleeReason);
    }
    clearCandidatesQueue(calleeId);
    var callee = userRegistry.getById(calleeId);
    if (!from || !userRegistry.getByName(from)) {
        return onError(null, 'Unknown from = ' + from);
    }
    var caller = userRegistry.getByName(from);
    if (callResponse === 'accept') {
        var pipeline = new CallMediaPipeline(true);
        pipelines[caller.id] = pipeline;
        pipelines[callee.id] = pipeline;
        pipeline.createPipeline(caller, callee, function(error) {
            if (error) {
                return onError(error, error);
            }
            pipeline.generateSdpAnswer(caller.id, caller.sdpOffer, function(error, callerSdpAnswer) {
                if (error) {
                    return onError(error, error);
                }
                pipeline.generateSdpAnswer(callee.id, calleeSdp, function(error, calleeSdpAnswer) {
                    if (error) {
                        return onError(error, error);
                    }
                    var message = {
                        id: 'startCommunication',
                        sdpAnswer: calleeSdpAnswer
                    };
                    callee.sendMessage(message);
                    message = {
                        id: 'callResponse',
                        response: 'accepted',
                        sdpAnswer: callerSdpAnswer
                    };
                    caller.sendMessage(message);
                });
            });
        });
    }
    else {
        var error = 'user declined';
        return onError(error, null);
    }
}

function clearCandidatesQueue(sessionId) {
    if (candidatesQueue[sessionId]) {
        delete candidatesQueue[sessionId];
    }
}

function onIceCandidate(sessionId, _candidate) {
    var candidate = kurento.register.complexTypes.IceCandidate(_candidate);
    var pipeline = pipelines[sessionId];
    if (pipeline && pipeline.webRtcEndpoint && pipeline.webRtcEndpoint[sessionId]) {
        var webRtcEndpoint = pipeline.webRtcEndpoint[sessionId];
        webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}

// Recover kurentoClient for the first time
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }
    var ws_uri = config.get('ws:uri');
    kurento(ws_uri, function(error, _kurentoClient) {
        if (error) {
            logger.error('Coult not find media server at address ' + ws_uri);
            return callback('Kurento client error: ' + error);
        }
        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

/*
 * Bind sockets
 */
for (var i in targets) {
    var socket = io.of(targets[i]);
    bind(socket);
}
};