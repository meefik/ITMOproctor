module.exports = function(io, targets) {
    var config = require('nconf');
    var kurento = require('kurento-client');

    /*
     * Definition of global variables
     */

    var kurentoClient = null;
    var userRegistry = new UserRegistry();
    var pipelines = {};
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
            this.ws.send(JSON.stringify(message));
        }
        catch (exception) {
            return exception;
        }
    }

    // Represents registrar of users
    function UserRegistry() {
        this.usersById = {};
        this.usersByName = {};
    }
    UserRegistry.prototype.register = function(user) {
        this.usersById[user.id] = user;
        this.usersByName[user.name] = user;
    }
    UserRegistry.prototype.unregister = function(id) {
        var user = this.getById(id);
        if (user) delete this.usersById[id]
        if (user && this.getByName(user.name)) delete this.usersByName[user.name];
    }
    UserRegistry.prototype.getById = function(id) {
        return this.usersById[id];
    }
    UserRegistry.prototype.getByName = function(name) {
        return this.usersByName[name];
    }
    UserRegistry.prototype.removeById = function(id) {
        var userSession = this.usersById[id];
        if (!userSession) return;
        delete this.usersById[id];
        delete this.usersByName[userSession.name];
    }

    // Represents a B2B active call
    function CallMediaPipeline(loopback) {
        this._loopback = loopback;
        this._pipeline = null;
        this._callerWebRtcEndpoint = null;
        this._calleeWebRtcEndpoint = null;
    }
    CallMediaPipeline.prototype.createPipeline = function(callback) {
        var self = this;
        getKurentoClient(function(error, kurentoClient) {
            if (error) {
                return callback(error);
            }
            kurentoClient.create('MediaPipeline', function(error, pipeline) {
                if (error) {
                    return callback(error);
                }
                pipeline.create('WebRtcEndpoint', function(error, callerWebRtcEndpoint) {
                    if (error) {
                        pipeline.release();
                        return callback(error);
                    }
                    if (self._loopback) {
                        callerWebRtcEndpoint.connect(callerWebRtcEndpoint, function(error) {
                            if (error) {
                                pipeline.release();
                                return callback(error);
                            }
                            self._pipeline = pipeline;
                            self._callerWebRtcEndpoint = callerWebRtcEndpoint;
                            callback(null);
                        });
                    }
                    else {
                        pipeline.create('WebRtcEndpoint', function(error, calleeWebRtcEndpoint) {
                            if (error) {
                                pipeline.release();
                                return callback(error);
                            }
                            callerWebRtcEndpoint.connect(calleeWebRtcEndpoint, function(error) {
                                if (error) {
                                    pipeline.release();
                                    return callback(error);
                                }
                                calleeWebRtcEndpoint.connect(callerWebRtcEndpoint, function(error) {
                                    if (error) {
                                        pipeline.release();
                                        return callback(error);
                                    }
                                });
                                self._pipeline = pipeline;
                                self._callerWebRtcEndpoint = callerWebRtcEndpoint;
                                self._calleeWebRtcEndpoint = calleeWebRtcEndpoint;
                                callback(null);
                            });
                        });
                    }
                });
            });
        })
    }
    CallMediaPipeline.prototype.generateSdpAnswerForCaller = function(sdpOffer, callback) {
        this._callerWebRtcEndpoint.processOffer(sdpOffer, callback);
    }
    CallMediaPipeline.prototype.generateSdpAnswerForCallee = function(sdpOffer, callback) {
        this._calleeWebRtcEndpoint.processOffer(sdpOffer, callback);
    }
    CallMediaPipeline.prototype.release = function() {
        if (this._pipeline) this._pipeline.release();
        this._pipeline = null;
    }

    /*
     * Definition of functions
     */

    // Bind socket
    function bind(socket) {
        socket.on('connection', function(ws) {
            var sessionId = nextUniqueId();
            console.log('Connection received with sessionId ' + sessionId);
            ws.on('error', function(error) {
                console.log('Connection ' + sessionId + ' error');
                stop(sessionId);
            });
            ws.on('close', function() {
                console.log('Connection ' + sessionId + ' closed');
                stop(sessionId);
                userRegistry.unregister(sessionId);
            });
            ws.on('message', function(_message) {
                var message = JSON.parse(_message);
                console.log('Connection ' + sessionId + ' received message ', message);
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
    function register(id, name, ws, callback) {
        function onError(error) {
            console.log("Error processing register: " + error);
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
        }
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
        var caller = userRegistry.getById(callerId);
        if (userRegistry.getByName(to)) {
            var callee = userRegistry.getByName(to);
            caller.sdpOffer = sdpOffer
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
                }
                stoppedUser.sendMessage(message)
            }
        }
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
        }
        var caller = userRegistry.getById(callerId);
        var pipeline = new CallMediaPipeline(true);
        pipeline.createPipeline(function(error) {
            if (error) {
                return onError(error);
            }
            pipeline.generateSdpAnswerForCaller(sdpOffer, function(error, callerSdpAnswer) {
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
        }
        var callee = userRegistry.getById(calleeId);
        if (!from || !userRegistry.getByName(from)) {
            return onError(null, 'Unknown from = ' + from);
        }
        var caller = userRegistry.getByName(from);
        if (callResponse === 'accept') {
            var pipeline = new CallMediaPipeline();
            pipeline.createPipeline(function(error) {
                if (error) {
                    return onError(error, error);
                }
                pipeline.generateSdpAnswerForCaller(caller.sdpOffer, function(error, callerSdpAnswer) {
                    if (error) {
                        return onError(error, error);
                    }
                    pipeline.generateSdpAnswerForCallee(calleeSdp, function(error, calleeSdpAnswer) {
                        if (error) {
                            return onError(error, error);
                        }
                        pipelines[caller.id] = pipeline;
                        pipelines[callee.id] = pipeline;
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

    // Recover kurentoClient for the first time
    function getKurentoClient(callback) {
        if (kurentoClient !== null) {
            return callback(null, kurentoClient);
        }
        var ws_uri = config.get('ws:uri');
        kurento(ws_uri, function(error, _kurentoClient) {
            if (error) {
                var message = 'Coult not find media server at address ' + ws_uri;
                console.log(message);
                return callback(message + ". Exiting with error " + error);
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
}