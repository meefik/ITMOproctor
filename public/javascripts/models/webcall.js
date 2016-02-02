//
// Exam model
//
define([], function() {
    console.log('models/webcall.js');
    var Model = Backbone.Model.extend({
        defaults: {
            iceServers: [{
                url: 'stun:stun.l.google.com:19302'
            }, {
                url: 'stun:stun1.l.google.com:19302'
            }, {
                url: 'stun:stun2.l.google.com:19302'
            }, {
                url: 'stun:stun3.l.google.com:19302'
            }, {
                url: 'stun:stun4.l.google.com:19302'
            }, {
                url: 'stun:stun.anyfirewall.com:3478'
            }, {
                url: 'turn:numb.viagenie.ca:3478?transport=udp',
                credential: 'proctor',
                username: 'proctor'
            }, {
                url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                credential: 'webrtc',
                username: 'webrtc'
            }]
        },
        initialize: function() {
            var self = this;
            this.audio = true;
            this.video = true;
            this.setCallState('NO_CALL');
            kurentoUtils.WebRtcPeer.prototype.server.iceServers = this.get("iceServers");
            this.get("socket").on('message', function(message) {
                var parsedMessage = JSON.parse(message);
                console.info('Received message: ' + message);
                switch (parsedMessage.id) {
                    case 'registerResponse':
                        self.resgisterResponse(parsedMessage);
                        break;
                    case 'callResponse':
                        self.callResponse(parsedMessage);
                        break;
                    case 'incomingCall':
                        self.incomingCall(parsedMessage);
                        break;
                    case 'startCommunication':
                        self.startCommunication(parsedMessage);
                        break;
                    case 'stopCommunication':
                        console.info("Communication ended by remote peer");
                        self.stop(false);
                        break;
                    default:
                        console.error('Unrecognized message', parsedMessage);
                }
            });
            this.register();
            this.get("socket").on('connect', function() {
                if (self.registerState != 'REGISTERING') {
                    self.register();
                }
            });
        },
        destroy: function() {
            this.stop(true);
            this.get("socket").removeListener('connect');
            this.get("socket").removeListener('message');
        },
        setRegisterState: function(nextState) {
            console.log('setRegisterState: ' + nextState);
            switch (nextState) {
                case 'NOT_REGISTERED':
                    // ...
                    break;
                case 'REGISTERING':
                    // ...
                    break;
                case 'REGISTERED':
                    // ...
                    break;
                default:
                    return;
            }
            this.registerState = nextState;
        },
        setCallState: function(nextState) {
            console.log('setCallState:' + nextState);
            switch (nextState) {
                case 'NO_CALL':
                    this.hideSpinner(this.get("input"), this.get("output"));
                    break;
                case 'PROCESSING_CALL':
                    this.showSpinner(this.get("input"), this.get("output"));
                    break;
                case 'IN_CALL':
                    // ...
                    break;
                default:
                    return;
            }
            this.callState = nextState;
        },
        resgisterResponse: function(message) {
            if (message.response == 'accepted') {
                this.setRegisterState('REGISTERED');
            }
            else {
                this.setRegisterState('NOT_REGISTERED');
                var errorMessage = message.message ? message.message : 'Unknown reason for register rejection.';
                console.log(errorMessage);
                console.error('Error registering user. See console for further information.');
            }
        },
        callResponse: function(message) {
            if (message.response != 'accepted') {
                console.info('Call not accepted by peer. Closing call');
                var errorMessage = message.message ? message.message : 'Unknown reason for call rejection.';
                console.log(errorMessage);
                this.stop(false);
            }
            else {
                this.startCommunication(message);
            }
        },
        incomingCall: function(message) {
            var self = this;
            //If bussy just reject without disturbing user
            if (this.callState != 'NO_CALL') {
                var response = {
                    id: 'incomingCallResponse',
                    from: message.from,
                    callResponse: 'reject',
                    message: 'bussy'
                };
                return this.sendMessage(response);
            }
            this.setCallState('PROCESSING_CALL');
            this.webRtcPeer = kurentoUtils.WebRtcPeer.startSendRecv(this.get("input"), this.get("output"), function(sdp, wp) {
                var response = {
                    id: 'incomingCallResponse',
                    from: message.from,
                    callResponse: 'accept',
                    sdpOffer: sdp
                };
                self.sendMessage(response);
            }, function(error) {
                self.setCallState('NO_CALL');
            }, self.get("constraints"));
        },
        startCommunication: function(message) {
            this.setCallState('IN_CALL');
            this.webRtcPeer.processSdpAnswer(message.sdpAnswer);
        },
        sendMessage: function(message) {
            var jsonMessage = JSON.stringify(message);
            console.log('Senging message: ' + jsonMessage);
            this.get("socket").send(jsonMessage);
        },
        register: function() {
            this.setRegisterState('REGISTERING');
            var message = {
                id: 'register',
                name: this.get("userid")
            };
            this.sendMessage(message);
        },
        call: function(peer) {
            if (this.callState != 'NO_CALL') return;
            if (!this.get("input") && !this.get("output")) return;
            this.setCallState('PROCESSING_CALL');
            var self = this;

            function onSdp(offerSdp, wp) {
                if (self.callState == 'NO_CALL') {
                    wp.dispose();
                }
                else {
                    self.webRtcPeer = wp;
                    console.log('Invoking SDP offer callback function');
                    var message = {
                        id: 'call',
                        from: self.get("userid"),
                        to: peer,
                        sdpOffer: offerSdp
                    };
                    self.sendMessage(message);
                }
            }

            function onError(error) {
                console.log(error);
                self.setCallState('NO_CALL');
            }
            if (this.get("input") && this.get("output")) {
                kurentoUtils.WebRtcPeer.startSendRecv(this.get("input"), this.get("output"), onSdp, onError, self.get("constraints"));
            }
            if (this.get("input") && !this.get("output")) {
                kurentoUtils.WebRtcPeer.startSendOnly(this.get("input"), onSdp, onError, self.get("constraints"));
            }
            if (!this.get("input") && this.get("output")) {
                kurentoUtils.WebRtcPeer.startRecvOnly(this.get("output"), onSdp, onError, self.get("constraints"));
            }
        },
        stop: function(flag) {
            this.setCallState('NO_CALL');
            if (this.webRtcPeer) {
                this.webRtcPeer.dispose();
                this.webRtcPeer = null;
            }
            if (flag !== false) {
                var message = {
                    id: 'stop'
                };
                if (flag === true) message.unregister = true;
                this.sendMessage(message);
            }
        },
        showSpinner: function() {
            for (var i = 0; i < arguments.length; i++) {
                if (!arguments[i]) continue;
                arguments[i].poster = 'images/transparent-1px.png';
                arguments[i].style.background = 'center transparent url("images/spinner.gif") no-repeat';
            }
        },
        hideSpinner: function() {
            for (var i = 0; i < arguments.length; i++) {
                if (!arguments[i]) continue;
                arguments[i].src = '';
                arguments[i].poster = 'images/webrtc.png';
                arguments[i].style.background = '';
            }
        },
        toggleAudio: function(audio) {
            if (typeof audio != 'undefined') {
                this.audio = audio;
            }
            else {
                this.audio = !this.audio;
            }
            if (this.webRtcPeer) {
                var audioTracks = this.webRtcPeer.pc.getLocalStreams()[0].getAudioTracks();
                audioTracks[0].enabled = this.audio;
            }
            return this.audio;
        },
        toggleVideo: function(video) {
            if (typeof video != 'undefined') {
                this.video = video;
            }
            else {
                this.video = !this.video;
            }
            if (this.webRtcPeer) {
                var videoTracks = this.webRtcPeer.pc.getLocalStreams()[0].getVideoTracks();
                videoTracks[0].enabled = this.video;
            }
            return this.video;
        }
    });
    return Model;
});