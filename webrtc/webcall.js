module.exports = function(io, targets) {
    var config = require('nconf');
    var kurento = require('kurento-client');

    /*
     * Definition of global variables.
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

    //Represents caller and callee sessions
    function UserSession(id, name, ws) {
        this.id = id;
        this.name = name;
        this.ws = ws;
        this.peer = null;
        this.sdpOffer = null;
    }
    UserSession.prototype.sendMessage = function(message) {
        this.ws.send(JSON.stringify(message));
    }

    //Represents registrar of users
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

    //Represents a B2B active call
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
     * Websockets
     */
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

    function stop(sessionId) {
        var pipeline = pipelines[sessionId];
        if (pipeline) {
            console.log('pipeline');
            delete pipelines[sessionId];
            pipeline.release();
        }
        var stopperUser = userRegistry.getById(sessionId);
        if (stopperUser) {
            console.log('stopperUser');
            stopperUser.peer = null;
        }
        var stoppedUser = userRegistry.getByName(stopperUser.peer);
        if (stoppedUser) {
            console.log('stoppedUser');
            stoppedUser.peer = null;
            delete pipelines[stoppedUser.id];
            var message = {
                id: 'stopCommunication',
                message: 'remote user hanged out'
            }
            stoppedUser.sendMessage(message)
        }
    }

    function incomingCallResponse(calleeId, from, callResponse, calleeSdp) {
        function onError(callerReason, calleeReason) {
            if (pipeline) pipeline.release();
            if (caller) {
                var callerMessage = {
                    id: 'callResponse',
                    response: 'rejected'
                };
                if (callerReason) callerMessage.message = callerReason;
                caller.sendMessage(callerMessage);
            }
            var calleeMessage = {
                id: 'stopCommunication'
            };
            if (calleeReason) calleeMessage.message = calleeReason;
            callee.sendMessage(calleeMessage);
        }
        var callee = userRegistry.getById(calleeId);
        if (!from || !userRegistry.getByName(from)) {
            return onError(null, 'unknown from = ' + from);
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
            var decline = {
                id: 'callResponse',
                response: 'rejected',
                message: 'user declined'
            };
            caller.sendMessage(decline);
        }
    }
    
    function loopbackCallResponce(callerId, sdpOffer) {
            function onError(callerReason) {
                if (pipeline) pipeline.release();
                if (caller) {
                    var callerMessage = {
                        id: 'callResponse',
                        response: 'rejected'
                    };
                    if (callerReason) callerMessage.message = callerReason;
                    caller.sendMessage(callerMessage);
                    console.log(callerMessage);
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

    function call(callerId, to, from, sdpOffer) {
        var caller = userRegistry.getById(callerId);
        if (to == from) {
            loopbackCallResponce(callerId, sdpOffer);
            return;
        }
        var rejectCause = 'user ' + to + ' is not registered';
        if (userRegistry.getByName(to)) {
            var callee = userRegistry.getByName(to);
            caller.sdpOffer = sdpOffer
            callee.peer = from;
            caller.peer = to;
            var message = {
                id: 'incomingCall',
                from: from
            };
            try {
                return callee.sendMessage(message);
            }
            catch (exception) {
                rejectCause = "Error " + exception;
            }
        }
        var message = {
            id: 'callResponse',
            response: 'rejected: ',
            message: rejectCause
        };
        caller.sendMessage(message);
    }

    function register(id, name, ws, callback) {
        function onError(error) {
            console.log("Error processing register: " + error);
            ws.send(JSON.stringify({
                id: 'registerResponse',
                response: 'rejected ',
                message: error
            }));
        }
        if (!name) {
            return onError("empty user name");
        }
        try {
            ws.send(JSON.stringify({
                id: 'registerResponse',
                response: 'accepted'
            }));
        }
        catch (exception) {
            onError(exception);
        }
        var user = userRegistry.getByName(name);
        if (user) {
            //return onError("already registered");
            //stop(user.id);
            //userRegistry.unregister(user.id);
            user.ws = ws;
            return user.id;
        }
        else {
            userRegistry.register(new UserSession(id, name, ws));
            return id;
        }
    }

    //Recover kurentoClient for the first time.
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

    //Bind sockets
    for (var i in targets) {
        var socket = io.of(targets[i]);
        bind(socket);
    }
}