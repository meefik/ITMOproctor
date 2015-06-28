//
// Global initialize
//
var app;
//
// Profile model
//
var Profile = Backbone.Model.extend({
    initialize: function() {
        this.update();
    },
    update: function() {
        var self = this;
        var result = false;
        $.ajax({
            method: "GET",
            url: "/profile",
            async: false
        }).done(function(user) {
            console.log('profile.update: success');
            self.clear().set(user);
            result = true;
        }).fail(function() {
            console.log('profile.update: error');
        });
        return result;
    },
    login: function(user) {
        var self = this;
        var result = false;
        $.ajax({
            method: "POST",
            url: "/profile/login",
            data: user,
            async: false
        }).done(function(user) {
            console.log('profile.login: success');
            self.clear().set(user);
            result = true;
        }).fail(function() {
            console.log('profile.login: error');
            self.clear();
        });
        return result;
    },
    logout: function() {
        var self = this;
        var result = false;
        $.ajax({
            method: "GET",
            url: "/profile/logout",
            async: false
        }).done(function() {
            console.log('profile.logout: success');
            self.clear();
            result = true;
        }).fail(function() {
            console.log('profile.logout: error');
        });
        return result;
    },
    isAuth: function() {
        return this.has("username");
    },
    isMe: function(id) {
        return this.get('_id') === id;
    }
});
//
// Webcall model
//
var Webcall = Backbone.Model.extend({
    initialize: function() {
        var self = this;
        this.mute = false;
        this.setCallState('NO_CALL');
        this.constraints = this.get("constraints");
        this.videoInput = this.get("input");
        this.videoOutput = this.get("output");
        this.userId = this.get("userid");
        this.socket = this.get("socket");
        this.socket.on('message', function(message) {
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
                    self.stop(true);
                    break;
                default:
                    console.error('Unrecognized message', parsedMessage);
            }
        });
        this.register();
        this.socket.on('connect', function() {
            if (self.registerState != 'REGISTERING') {
                self.register();
            }
        });
    },
    destroy: function() {
        this.stop();
        this.socket.removeListener('connect');
        this.socket.removeListener('message');
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
                // ...
                break;
            case 'PROCESSING_CALL':
                // ...
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
            this.stop(true);
        }
        else {
            this.setCallState('IN_CALL');
            this.webRtcPeer.processSdpAnswer(message.sdpAnswer);
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
        this.showSpinner(this.videoInput, this.videoOutput);
        this.webRtcPeer = kurentoUtils.WebRtcPeer.startSendRecv(this.videoInput, this.videoOutput, function(sdp, wp) {
            var response = {
                id: 'incomingCallResponse',
                from: message.from,
                callResponse: 'accept',
                sdpOffer: sdp
            };
            self.sendMessage(response);
        }, function(error) {
            self.setCallState('NO_CALL');
        }, self.constraints);
    },
    startCommunication: function(message) {
        this.setCallState('IN_CALL');
        this.webRtcPeer.processSdpAnswer(message.sdpAnswer);
    },
    sendMessage: function(message) {
        var jsonMessage = JSON.stringify(message);
        console.log('Senging message: ' + jsonMessage);
        this.socket.send(jsonMessage);
    },
    register: function() {
        this.setRegisterState('REGISTERING');
        var message = {
            id: 'register',
            name: this.userId
        };
        this.sendMessage(message);
    },
    call: function(peer) {
        if (this.callState != 'NO_CALL') return;
        var self = this;
        this.setCallState('PROCESSING_CALL');
        this.showSpinner(this.videoInput, this.videoOutput);
        kurentoUtils.WebRtcPeer.startSendRecv(this.videoInput, this.videoOutput, function(offerSdp, wp) {
            if (self.callState == 'NO_CALL') {
                wp.dispose();
            }
            else {
                self.webRtcPeer = wp;
                console.log('Invoking SDP offer callback function');
                var message = {
                    id: 'call',
                    from: self.userId,
                    to: peer,
                    sdpOffer: offerSdp
                };
                self.sendMessage(message);
            }
        }, function(error) {
            console.log(error);
            self.setCallState('NO_CALL');
        }, self.constraints);
    },
    stop: function(message) {
        this.setCallState('NO_CALL');
        if (this.webRtcPeer) {
            this.webRtcPeer.dispose();
            this.webRtcPeer = null;
        }
        if (!message) {
            var message = {
                id: 'stop'
            }
            this.sendMessage(message);
        }
        this.hideSpinner(this.videoInput, this.videoOutput);
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
    getMediaSources: function(kind, callback) {
        MediaStreamTrack.getSources(function(sources) {
            var mediaSources = [];
            for (var i = 0, l = sources.length; i < l; i++) {
                var source = sources[i];
                if (source.kind == kind) {
                    mediaSources.push(source);
                }
            }
            if (callback) callback(mediaSources);
        });
    },
    toggleMute: function(mute) {
        if (typeof mute != 'undefined') {
            this.mute = mute;
            return this.mute;
        }
        if (!this.webRtcPeer) {
            return false;
        }
        else {
            var audioTracks = this.webRtcPeer.pc.getLocalStreams()[0].getAudioTracks();
            audioTracks[0].enabled = this.mute;
            this.mute = !this.mute;
            return this.mute;
        }
    }
});
//
// Settings collection
//
var Settings = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage("settings"),
    initialize: function() {
        this.model = Backbone.Model.extend({
            idAttribute: 'name'
        });
        this.fetch();
    },
    save: function(items) {
        var self = this;
        items.forEach(function(item, i, arr) {
            var model = self.add(item, {
                merge: true
            });
            model.save();
        });
    },
    load: function() {
        var items = {};
        this.toJSON().forEach(function(item, i, arr) {
            items[item.name] = item.value;
        });
        return items;
    }
});
//
// Application routing
//
var Workspace = Backbone.Router.extend({
    routes: {
        "": "main",
        "login": "login",
        "monitor": "monitor",
        "vision/:examid": "vision",
        "play/:examid": "play",
        "schedule": "schedule",
        "student/:examid": "student",
        "admin": "admin"
    },
    main: function() {
        if (app.profile.isAuth()) {
            var role = app.profile.get("role");
            var navigate = "login";
            switch (role) {
                case 1:
                    navigate = "schedule";
                    break;
                case 2:
                case 3:
                    navigate = "monitor";
                    break;
                case 4:
                    navigate = "admin";
                    break;
            }
            this.navigate(navigate, {
                trigger: true
            });
        }
        else {
            this.navigate("login", {
                trigger: true
            });
        }
    },
    login: function() {
        console.log("route: #login");
        this.destroy();
        app.render("/templates/login.tpl", function() {
            var view = new LoginView({
                el: $("#login")
            });
            app.content = view;
        });
    },
    monitor: function() {
        console.log("route: #monitor");
        if (this.redirect()) return;
        this.destroy();
        app.render("/templates/monitor.tpl", function() {
            var view = new MonitorView({
                el: $("#monitor")
            });
            app.content = view;
        });
    },
    vision: function(examid) {
        console.log("route: #vision");
        if (this.redirect()) return;
        this.destroy();
        app.render("/templates/vision.tpl", function() {
            var view = new VisionView({
                el: $("#vision"),
                id: examid
            });
            app.content = view;
        });
    },
    schedule: function() {
        console.log("route: #schedule");
        if (this.redirect()) return;
        this.destroy();
        app.render("/templates/schedule.tpl", function() {
            var view = new ScheduleView({
                el: $("#schedule")
            });
            app.content = view;
        });
    },
    student: function(examid) {
        console.log("route: #student");
        if (this.redirect()) return;
        this.destroy();
        app.render("/templates/student.tpl", function() {
            var view = new StudentView({
                el: $("#student"),
                id: examid
            });
            app.content = view;
        });
    },
    play: function(examid) {
        console.log("route: #play");
        if (this.redirect()) return;
        this.destroy();
    },
    admin: function() {
        console.log("route: #admin");
        if (this.redirect()) return;
        this.destroy();
    },
    redirect: function() {
        if (!app.profile.isAuth()) {
            this.navigate("login", {
                trigger: true
            });
            return true;
        }
        else {
            return false;
        }
    },
    destroy: function() {
        if (app.content) {
            app.content.destroy();
            delete app.content;
        }
    }
});
//
// Login view
//
var LoginView = Backbone.View.extend({
    events: {
        "click input[type='submit']": "submit"
    },
    initialize: function() {
        this._Form = this.$("form");
        this._Username = this.$(".username");
        this._Password = this.$(".password");
        this.render();
    },
    destroy: function() {
        this.remove();
    },
    render: function() {
        this.focus();
    },
    submit: function() {
        var username = this._Username.textbox('getValue');
        var password = this._Password.textbox('getValue');
        var user = {
            username: username,
            password: password
        };
        if (app.profile.login(user)) {
            app.router.navigate("", {
                trigger: true
            });
        }
        else {
            this.reset();
            this.focus();
        }
        return false;
    },
    reset: function() {
        this._Form.form("reset");
    },
    focus: function() {
        this._Username.next().find("input").focus();
    }
});
//
// Monitor view
//        
var MonitorView = Backbone.View.extend({
    events: {
        "click .status-btn1": "doSearch",
        "click .status-btn2": "doSearch",
        "click .status-btn3": "doSearch",
        "click .grid-reload": "doReload",
    },
    initialize: function() {
        // Variables
        var self = this;
        // jQuery selectors
        this._Menu = $('#main-menu');
        this._Grid = this.$(".easyui-datagrid");
        this._DateSearch = this.$(".date-search");
        this._TextSearch = this.$(".text-search");
        this._StatusBtn1 = this.$(".status-btn1");
        this._StatusBtn2 = this.$(".status-btn2");
        this._StatusBtn3 = this.$(".status-btn3");
        this._TimeWidget = this.$(".time-widget");
        this._LoguserWidget = this.$(".loguser-widget");
        this._DialogInfo = $("#exam-info-dlg");
        this._ExamInfoTpl = $("#exam-info-tpl");
        // Event handlers
        this._Menu.menu({
            onClick: function(item) {
                switch (item.name) {
                    case "profile":
                        self.view.profile.doOpen();
                        break;
                    case "settings":
                        self.view.settings.doOpen();
                        break;
                    case "logout":
                        app.logout();
                        break;
                }
            }
        });
        this._DateSearch.datebox({
            value: moment().format("DD.MM.YYYY"),
            onChange: function(date) {
                var valid = moment(date, "DD.MM.YYYY", true).isValid();
                if (!date || valid) self.doSearch();
            }
        });
        this._TextSearch.searchbox({
            searcher: function(value, name) {
                self.doSearch();
            }
        });
        // Sub views
        this.view = {
            settings: new SettingsView(),
            profile: new ProfileView()
        };
        // Timers
        var t1 = setInterval(function() {
            self._TimeWidget.text(moment().format('HH:mm:ss'));
        }, 1000);
        this.timers = [t1];
        // Monitor model
        var Monitor = Backbone.Model.extend({
            urlRoot: '/monitor'
        });
        this.monitor = new Monitor();
        // Rendering
        this.render();
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        this.remove();
    },
    render: function() {
        var self = this;
        this._Grid.datagrid({
            columns: [
                [{
                    field: 'examId',
                    title: 'ID',
                    width: 60
                }, {
                    field: 'student',
                    title: 'Студент',
                    width: 150,
                    formatter: self.formatStudent
                }, {
                    field: 'subject',
                    title: 'Экзамен',
                    width: 200,
                    formatter: self.formatSubject
                }, {
                    field: 'beginDate',
                    title: 'Дата',
                    width: 150,
                    formatter: self.formatDate
                }, {
                    field: 'duration',
                    title: 'Продолжительность',
                    width: 100,
                    formatter: self.formatDuration
                }, {
                    field: 'curator',
                    title: 'Инспектор',
                    width: 150,
                    formatter: self.formatCurator
                }, {
                    field: 'status',
                    title: 'Статус',
                    width: 100,
                    formatter: self.formatStatus
                }, {
                    field: 'action',
                    title: 'Действие',
                    align: 'center',
                    formatter: self.formatAction
                }]
            ],
            url: '/monitor',
            method: 'get',
            queryParams: {
                from: moment().startOf('day').toJSON(),
                to: moment().startOf('day').add(1, 'days').toJSON()
            }
        });
        this._LoguserWidget.text(app.profile.get("lastname") + " " + app.profile.get("firstname") + " " + app.profile.get("middlename") + " (" + app.profile.get("roleName") + ")");
    },
    formatStatus: function(val, row) {
        var status = 0;
        var d = new Date();
        var beginDate = new Date(row.beginDate);
        var endDate = new Date(row.endDate);
        if (beginDate <= d && endDate > d && row.curator.length == 0) status = 1;
        if (row.startDate != null && row.stopDate == null && row.curator.length != 0) status = 2;
        if (row.resolution === true) status = 3;
        if (row.resolution === false) status = 4;
        if (endDate <= d && row.curator.length == 0) status = 5;
        if (beginDate > d) status = 6;
        switch (status) {
            case 1:
                return '<span style="color:orange;">Ожидает</span>';
            case 2:
                return '<span style="color:red;">Идет</span>';
            case 3:
                return '<span style="color:green;">Сдан</span>';
            case 4:
                return '<span style="color:purple;">Прерван</span>';
            case 5:
                return '<span style="color:gray;">Пропущен</span>';
            case 6:
                return '<span style="color:blue;">Запланирован</span>';
            default:
                return null;
        }
    },
    formatAction: function(val, row) {
        var html = $('#action-item-tpl').html();
        var tpl = _.template(html);
        var d = moment();
        var beginDate = moment(row.beginDate);
        var endDate = moment(row.endDate);
        return tpl({
            rowId: row._id,
            openEnabled: (beginDate <= d && endDate > d)
        });
    },
    formatDuration: function(val, row) {
        if (row.startDate == null) return null;
        var startDate = moment(row.startDate);
        var stopDate = moment();
        if (row.stopDate != null) stopDate = moment(row.stopDate);
        var duration = stopDate - startDate;
        return moment(duration).utc().format('HH:mm:ss');
    },
    formatDate: function(val, row) {
        if (val == null) return null;
        else {
            var d = new Date(val);
            return moment(d).format('DD.MM.YYYY HH:mm');
        }
    },
    formatSubject: function(val, row) {
        if (val == null) return null;
        return val.title + " (" + val.code + ")";
    },
    formatStudent: function(val, row) {
        if (val == null) return null;
        var user = val;
        return user.lastname + " " + user.firstname + " " + user.middlename;
    },
    formatCurator: function(val, row) {
        if (val == null || val.length === 0) return null;
        var user = val[0];
        return user.lastname + " " + user.firstname + " " + user.middlename;
    },
    doSearch: function() {
        var status = 0;
        switch (true) {
            case this._StatusBtn1.linkbutton('options').selected:
                status = 1;
                break;
            case this._StatusBtn2.linkbutton('options').selected:
                status = 2;
                break;
            case this._StatusBtn3.linkbutton('options').selected:
                status = 3;
                break;
        }
        var text = this._TextSearch.textbox('getValue');
        var date = this._DateSearch.datebox('getValue');
        var fromDate = date ? moment(date, 'DD.MM.YYYY').toJSON() : null;
        var toDate = date ? moment(date, 'DD.MM.YYYY').add(1, 'days').toJSON() : null;
        this._Grid.datagrid('load', {
            status: status,
            from: fromDate,
            to: toDate,
            text: text
        });
    },
    doReload: function() {
        this._Grid.datagrid('reload');
    },
    doInfo: function(rowid) {
        var self = this;
        var tpl = _.template(this._ExamInfoTpl.html());
        this.monitor.set('id', rowid);
        this.monitor.fetch({
            success: function(model, response, options) {
                var html = tpl(model.toJSON());
                self._DialogInfo.html(html);
                self._DialogInfo.dialog('open');
            }
        });
    },
    doPlay: function(rowid) {
        app.router.navigate("vision/" + rowid, {
            trigger: true
        });
    }
});
//
// Vision view
//
var VisionView = Backbone.View.extend({
    events: {
        "click .screenshot-btn": "doScreenshot",
        "click .student-info-btn": "showStudentInfo",
        "click .exam-info-btn": "showExamInfo",
        "click .exam-stop-btn": "rejectExam",
        "click .exam-apply-btn": "applyExam"
    },
    initialize: function() {
        // Variables
        var self = this;
        this.protectionCode = null;
        // jQuery selectors
        this._Menu = $('#main-menu');
        this._NetworkWidget = this.$('.network-widget');
        this._TimeWidget = this.$('.time-widget');
        this._DurationWidget = this.$('.duration-widget');
        this._StudentWidget = this.$('.student-widget');
        this._ExamWidget = this.$('.exam-widget');
        this._DialogStudent = $('#student-info-dlg');
        this._DialogExam = $('#exam-info-dlg');
        this._DialogScreenshot = $("#screenshot-dlg");
        this._ScreenshotPreview = this._DialogScreenshot.find('img');
        this._ScreenshotComment = this._DialogScreenshot.find('.screenshot-comment');
        this._DialogConfirm = $("#exam-confirm-dlg");
        this._ProtectionCode = this._DialogConfirm.find('.protection-code');
        this._ProtectionCodeInput = this._DialogConfirm.find('.protection-code-input');
        this._ExamComment = this._DialogConfirm.find('.exam-comment');
        this._ApplyText = this._DialogConfirm.find('.apply-text');
        this._RejectText = this._DialogConfirm.find('.reject-text');
        this._StudentInfoTpl = $("#student-info-tpl");
        this._ExamInfoTpl = $("#exam-info-tpl");
        // Event handlers
        this._Menu.menu({
            onClick: function(item) {
                switch (item.name) {
                    case "profile":
                        self.view.profile.doOpen();
                        break;
                    case "settings":
                        self.view.settings.doOpen();
                        break;
                    case "logout":
                        app.logout();
                        break;
                }
            }
        });
        // set validate method
        $.extend($.fn.validatebox.defaults.rules, {
            protectionCode: {
                validator: function(value, param) {
                    return value == self.protectionCode;
                },
                message: 'Неверный код подтверждения'
            }
        });
        // set protection code method
        this._ProtectionCodeInput.validatebox({
            required: true,
            validType: 'protectionCode',
        });
        // Resize widgets
        var resizeWidget = function(container, pobj) {
            var p = pobj.panel('panel');
            p.detach().appendTo(container).css({
                position: 'absolute',
                top: 0,
                left: 0
            });
            pobj.panel('resize', {
                width: container.width(),
                height: container.height()
            });
            pobj.find('video').each(function(index, element) {
                if (element.src != '') {
                    element.play();
                }
                if (element.className == 'videoInput') {
                    element.style.left = '';
                    element.style.bottom = '';
                    element.style.top = '5px';
                    element.style.right = '5px';
                }
            });
        }
        this.$(".ws-widget").each(function(index, element) {
            var wsWidget = $(element);
            var wsContent = self.$(".ws-content");
            var wsPanel = wsWidget.find(".ws-panel");
            wsPanel.panel({
                onMaximize: function() {
                    resizeWidget(wsContent, wsPanel);
                },
                onRestore: function() {
                    resizeWidget(wsWidget, wsPanel);
                }
            });
        });
        // Vision model
        var Vision = Backbone.Model.extend({
            urlRoot: '/vision'
        });
        this.vision = new Vision({
            id: this.id
        });
        // Sub views
        this.view = {
            settings: new SettingsView(),
            profile: new ProfileView(),
            notes: new NotesView({
                el: $("#panel-notes"),
                id: 'notes-' + this.id
            }),
            chat: new ChatView({
                el: $("#panel-chat"),
                id: 'chat-' + this.id
            }),
            protocol: new ProtocolView({
                el: $("#panel-protocol"),
                id: 'protocol-' + this.id
            }),
            webcam: new WebcamView({
                el: $("#panel-webcam"),
                id: 'webcam-' + this.id
            }),
            screen: new ScreenView({
                el: $("#panel-screen"),
                id: 'screen-' + this.id
            })
        };
        this.view.webcam.toolbar();
        this.view.screen.toolbar();
        // Timers
        this.timer = moment(0);
        var t1 = setInterval(function() {
            self.timer.add(1, 'seconds');
            self._DurationWidget.text(self.timer.utc().format('HH:mm:ss'));
            var nowDate = moment();
            var endDate = moment(self.vision.get("endDate"));
            if (endDate.diff(nowDate, 'minutes') <= 5) self._DurationWidget.css('color', 'red');
            else if (endDate.diff(nowDate, 'minutes') <= 15) self._DurationWidget.css('color', 'orange');
        }, 1000);
        var t2 = setInterval(function() {
            self._TimeWidget.text(moment().format('HH:mm:ss'));
        }, 1000);
        this.timers = [t1, t2];
        // Rendering
        this.render();
    },
    render: function() {
        var self = this;
        this.vision.fetch({
            success: function(model, response, options) {
                var student = model.get("student");
                var subject = model.get("subject");
                var startDate = model.get("startDate");
                var duration = moment() - moment(startDate);
                if (duration > 0) self.timer = moment(duration);
                self._StudentWidget.text(student.lastname + " " + student.firstname + " " + student.middlename);
                self._ExamWidget.text(subject.title + " (" + subject.code + ")");

            }
        });
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        if (this.view.notes) this.view.notes.destroy();
        if (this.view.protocol) this.view.protocol.destroy();
        if (this.view.chat) this.view.chat.destroy();
        if (this.view.webcam) this.view.webcam.destroy();
        if (this.view.screen) this.view.screen.destroy();
        this.remove();
    },
    showStudentInfo: function() {
        var tpl = _.template(this._StudentInfoTpl.html());
        var vision = this.vision.toJSON();
        var html = tpl(vision);
        this._DialogStudent.html(html);
        this._DialogStudent.dialog('open');
    },
    showExamInfo: function() {
        var tpl = _.template(this._ExamInfoTpl.html());
        var vision = this.vision.toJSON();
        var html = tpl(vision);
        this._DialogExam.html(html);
        this._DialogExam.dialog('open');
    },
    doScreenshot: function() {
        var self = this;
        var dataUrl;
        var closeBtn = function() {
            self._DialogScreenshot.dialog('close');
            self._ScreenshotComment.textbox('setValue', '');
        };
        var saveBtn = function() {
            var blobBin = atob(dataUrl.split(',')[1]);
            var array = [];
            for (var i = 0; i < blobBin.length; i++) {
                array.push(blobBin.charCodeAt(i));
            }
            var file = new Blob([new Uint8Array(array)], {
                type: 'image/png'
            });
            var formdata = new FormData();
            formdata.append(0, file, "screenshot.png");
            $.ajax({
                url: "/storage",
                type: "post",
                data: formdata,
                processData: false,
                contentType: false,
            }).done(function(respond) {
                console.log(respond);
                var comment = self._ScreenshotComment.textbox('getValue');
                var attach = [];
                attach.push({
                    fileId: respond.fileId,
                    filename: respond.originalname,
                    uploadname: respond.name
                });
                self.notes.collection.create({
                    time: new Date(),
                    text: comment,
                    attach: attach
                });
                closeBtn();
            });
        };
        html2canvas(document.body, {
            onrendered: function(canvas) {
                dataUrl = canvas.toDataURL('image/png');
                $(canvas).remove();
                self._ScreenshotPreview.attr({
                    src: dataUrl
                });
                self._DialogScreenshot.dialog({
                    closed: false,
                    buttons: [{
                        text: 'Сохранить',
                        iconCls: 'fa fa-check',
                        handler: saveBtn
                    }, {
                        text: 'Отменить',
                        iconCls: 'fa fa-times',
                        handler: closeBtn
                    }]
                });
            }
        });
    },
    confirmDlg: function(resolution) {
        var self = this;
        var reset = function() {
            self.generateCode();
            self._ProtectionCode.text(self.protectionCode);
            self._ProtectionCodeInput.val('');
            self._ProtectionCodeInput.focus();
        };
        if (resolution) {
            this._ApplyText.show();
            this._RejectText.hide();
        }
        else {
            this._RejectText.show();
            this._ApplyText.hide();
        }
        this._DialogConfirm.dialog({
            closed: false,
            buttons: [{
                text: 'Подтвердить',
                handler: function() {
                    if (self._ProtectionCodeInput.validatebox('isValid')) {
                        self.vision.save({
                            _id: self.id,
                            resolution: resolution,
                            comment: self._ExamComment.textbox('getValue')
                        }, {
                            success: function() {
                                self._DialogConfirm.dialog('close');
                                app.router.navigate("monitor", {
                                    trigger: true
                                });
                            }
                        });
                    }
                    else {
                        reset();
                    }
                }
            }, {
                text: 'Отмена',
                handler: function() {
                    self._DialogConfirm.dialog('close');
                }
            }],
            onOpen: function() {
                reset();
            }
        });
    },
    applyExam: function() {
        this.confirmDlg(true);
    },
    rejectExam: function() {
        this.confirmDlg(false);
    },
    generateCode: function() {
        var randomizeNumber = function(min, max) {
            return Math.ceil((Math.random() * (max - min)) + min);
        }
        this.protectionCode = randomizeNumber(1000, 9999);
    }
});
//
// Notes view
//
var NotesView = Backbone.View.extend({
    events: {
        "click .note-add-btn": "add"
    },
    initialize: function() {
        // Note model
        var Note = Backbone.Model.extend({
            //urlRoot: '/notes'
            idAttribute: "_id"
        });
        // Notes collection
        var NotesList = Backbone.Collection.extend({
            url: '/notes',
            model: Note,
            comparator: 'time'
        });
        // Single item view
        this.ItemView = Backbone.View.extend({
            tagName: "li",
            events: {
                "click a.note-remove": "delete",
                "click a.note-edit": "edit"
            },
            initialize: function() {
                this.template = _.template($('#note-item-tpl').html());
                this._Dialog = $("#note-dlg");
                this._DialogForm = this._Dialog.find("form");
                this._DialogTime = this._Dialog.find(".note-time");
                this._DialogText = this._Dialog.find(".note-text");
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'destroy', this.remove);
            },
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                return this;
            },
            edit: function() {
                var self = this;
                var updateNote = function() {
                    var noteText = self._DialogText.textbox('getValue');
                    self.model.save({
                        text: noteText
                    }, {
                        success: function() {
                            self.close();
                        }
                    });
                }
                var closeDlg = function() {
                    self.close();
                }
                self._Dialog.dialog({
                    title: 'Редактирование заметки',
                    buttons: [{
                        text: 'Сохранить',
                        iconCls: 'fa fa-check',
                        handler: updateNote
                    }, {
                        text: 'Отменить',
                        iconCls: 'fa fa-times',
                        handler: closeDlg
                    }],
                    onOpen: function() {
                        moment.locale('ru');
                        var timeStr = moment(self.model.get('time')).format('LLL');
                        self._DialogTime.text(timeStr);
                    }
                });
                self._DialogForm.form('load', this.model.toJSON());
                self._Dialog.dialog('open');
            },
            close: function() {
                this._DialogForm.form('reset');
                this._Dialog.dialog('close');
            },
            delete: function() {
                var self = this;
                $.messager.confirm('Подтверждение', 'Вы действительно хотите удалить выбранную заметку?', function(r) {
                    if (r) {
                        self.model.destroy();
                    }
                });
            }
        });
        var self = this;
        this._Panel = this.$(".notes-panel");
        this._List = this.$(".notes-list");
        this._Input = this.$(".note-input");
        this._Input.textbox('textbox').bind('keypress', function(e) {
            if (e.keyCode == 13) self.add();
        });
        this.collection = new NotesList();
        this.listenTo(this.collection, 'add', this.appendItem);
        this.collection.fetch();
        app.io.notify.on(this.id, function(data) {
            if (!app.profile.isMe(data.userId)) {
                self.collection.fetch();
            }
        });
    },
    destroy: function() {
        app.io.notify.removeListener(this.id);
        this.remove();
    },
    add: function() {
        var noteText = this._Input.textbox('getValue');
        if (!noteText) return;
        this.collection.create({
            time: new Date(),
            text: noteText,
            attach: []
        });
        this._Input.textbox('setValue', '');
    },
    appendItem: function(model) {
        var view = new this.ItemView({
            model: model
        });
        this._List.append(view.render().el);
        this._Panel.scrollTop(this._Panel[0].scrollHeight);
    }
});
//
// Chat view
//
var ChatView = Backbone.View.extend({
    events: {
        "click .chat-send-btn": "doSend",
        "click .chat-attach-btn": "doAttach",
        "click .chat-file-btn": "doReset",
        "keyup .chat-input": "doInputKeyup",
        "change .chat-attach-input": "doFileChange"
    },
    initialize: function() {
        // Chat model
        var Chat = Backbone.Model.extend({
            idAttribute: "_id"
        });
        // Chat collection
        var ChatList = Backbone.Collection.extend({
            url: '/chat',
            model: Chat,
            comparator: 'time'
        });
        // Single item view
        this.ItemView = Backbone.View.extend({
            tagName: "li",
            initialize: function() {
                //console.log('initialize');
                this.template = _.template($('#chat-item-tpl').html());
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'destroy', this.remove);
            },
            render: function() {
                //console.log('render');
                this.$el.html(this.template(this.model.toJSON()));
                return this;
            }
        });
        this._Panel = this.$(".chat-panel");
        this._Form = this.$("form");
        this._Input = this.$(".chat-input");
        this._Output = this.$(".chat-output");
        this._FileBtn = this.$(".chat-file-btn");
        this._AttachInput = this.$(".chat-attach-input");
        this._AttachBtn = this.$(".chat-attach-btn");
        this._Progress = this.$(".chat-progress");
        $.extend($.fn.progressbar.methods, {
            setColor: function(jq, color) {
                var pb = jq.find('.progressbar-value > .progressbar-text');
                var defaultColor = $.data(jq[0], 'progressbar').options.color;
                if (!defaultColor) {
                    defaultColor = pb.css('backgroundColor');
                    $.data(jq[0], 'progressbar').options.color = defaultColor;
                }
                if (color) {
                    pb.css({
                        backgroundColor: color
                    });
                }
                else {
                    pb.css({
                        backgroundColor: defaultColor
                    });
                }
            }
        });
        this.attach = [];
        this.collection = new ChatList();
        this.listenTo(this.collection, 'add', this.appendItem);
        this.collection.fetch();
        var self = this;
        app.io.notify.on(this.id, function(data) {
            if (!app.profile.isMe(data.userId)) {
                self.collection.fetch();
            }
        });
    },
    destroy: function() {
        app.io.notify.removeListener(this.id);
        this.remove();
    },
    doSend: function() {
        var text = this._Input.text();
        if (text || this.attach.length > 0) {
            var author = {
                _id: app.profile.get('_id'),
                lastname: app.profile.get('lastname'),
                firstname: app.profile.get('firstname'),
                middlename: app.profile.get('middlename')
            };
            this.collection.create({
                time: new Date(),
                author: author,
                text: text,
                attach: this.attach
            });
        }
        this.doReset();
    },
    appendItem: function(model) {
        var view = new this.ItemView({
            model: model
        });
        this._Output.append(view.render().el);
        this._Panel.scrollTop(this._Panel[0].scrollHeight);
    },
    doInputKeyup: function(e) {
        if (e.keyCode == 13) {
            this.doSend();
        }
    },
    doAttach: function() {
        if (this.attach.length > 0) return;
        this._AttachInput.trigger('click');
    },
    doReset: function() {
        this.attach = [];
        this._Input.html('');
        this._FileBtn.hide();
        this._AttachBtn.linkbutton('enable');
        this._Form.trigger('reset');
    },
    doFileChange: function() {
        var self = this;
        var limitSize = 10 * 1024 * 1024; // 10 MB
        var data = new FormData();
        var files = self._AttachInput[0].files;
        if (files.length === 0 || files[0].size > limitSize) {
            return;
        }
        $.each(files, function(key, value) {
            data.append(key, value);
        });
        var filename = files['0'].name;
        self._Progress.progressbar('setColor', null);
        self._FileBtn.show();
        self._AttachBtn.linkbutton('disable');
        var trancateFile = function(filename, length) {
            var extension = filename.indexOf('.') > -1 ? filename.split('.').pop() : '';
            if (filename.length > length) {
                filename = filename.substring(0, length) + '...' + extension;
            }
            return filename;
        }
        self._Progress.progressbar({
            value: 0,
            text: trancateFile(filename, 15)
        });
        $.ajax({
            type: 'post',
            url: '/storage',
            data: data,
            xhr: function() {
                var xhr = $.ajaxSettings.xhr();
                xhr.upload.onprogress = function(progress) {
                    var percentage = Math.floor((progress.loaded / progress.total) * 100);
                    self._Progress.progressbar('setValue', percentage);
                };
                return xhr;
            },
            processData: false,
            contentType: false
        }).done(function(respond) {
            console.log(respond);
            self.attach.push({
                fileId: respond.fileId,
                filename: respond.originalname,
                uploadname: respond.name
            });
            self._Progress.progressbar('setColor', 'green');
        });
    }
});
//
// Protocol view
//
var ProtocolView = Backbone.View.extend({
    initialize: function() {
        // Protocol model
        var Protocol = Backbone.Model.extend({
            idAttribute: "_id"
        });
        // Protocol collection
        var ProtocolList = Backbone.Collection.extend({
            url: '/protocol',
            model: Protocol,
            comparator: 'time'
        });
        // Single item view
        this.ItemView = Backbone.View.extend({
            tagName: "li",
            initialize: function() {
                this.template = _.template($('#protocol-item-tpl').html());
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'destroy', this.remove);
            },
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                return this;
            }
        });
        this._Panel = this.$(".protocol-panel");
        this._Output = this.$(".protocol-output");
        this.collection = new ProtocolList();
        this.listenTo(this.collection, 'add', this.appendItem);
        this.collection.fetch();
        var self = this;
        app.io.notify.on(this.id, function(data) {
            if (!app.profile.isMe(data.userId)) {
                self.collection.fetch();
            }
        });
    },
    destroy: function() {
        app.io.notify.removeListener(this.id);
        this.remove();
    },
    appendItem: function(model) {
        var view = new this.ItemView({
            model: model
        });
        this._Output.append(view.render().el);
        this._Panel.scrollTop(this._Panel[0].scrollHeight);
    }
});
//
// Webcam view
//
var WebcamView = Backbone.View.extend({
    initialize: function() {
        this._VideoInput = this.$(".video-input");
        this._VideoOutput = this.$(".video-output");
        this._VideoInput.draggable({
            onDrag: function(e) {
                var d = e.data;
                var parent = $(d.parent);
                var target = $(d.target);
                if (d.left < 0) {
                    d.left = 0
                }
                if (d.top < 0) {
                    d.top = 0
                }
                if (d.left + target.outerWidth() > parent.width()) {
                    d.left = parent.width() - target.outerWidth();
                }
                if (d.top + target.outerHeight() > parent.height()) {
                    d.top = parent.height() - target.outerHeight();
                }
            }
        });
        var videoInput = this._VideoInput.get(0);
        var videoOutput = this._VideoOutput.get(0);
        // Settings
        var audioSource = app.settings.get('webcamera-audio');
        audioSource = audioSource ? audioSource.get('value') : null;
        var videoSource = app.settings.get('webcamera-video');
        videoSource = videoSource ? videoSource.get('value') : null;
        var resolution = app.settings.get('screen-resolution');
        resolution = resolution ? resolution.get('value').split('x') : [1280, 720];
        var fps = app.settings.get('screen-fps');
        fps = fps ? fps.get('value') : 15;
        var constraints = {
            audio: {
                optional: [{
                    sourceId: audioSource
                }]
            },
            video: {
                mandatory: {
                    maxWidth: resolution[0],
                    maxHeight: resolution[1],
                    maxFrameRate: fps,
                    minFrameRate: 1
                },
                optional: [{
                    sourceId: videoSource
                }]
            }
        };
        this.webcall = new Webcall({
            socket: app.io.call,
            constraints: constraints,
            input: videoInput,
            output: videoOutput,
            userid: "webcam-" + app.profile.get('_id')
        });
    },
    destroy: function() {
        if (this.webcall) this.webcall.destroy();
        this.remove();
    },
    toolbar: function() {
        var self = this;
        this.$el.panel({
            tools: [{
                iconCls: 'fa fa-play',
                handler: function() {
                    self.play();
                    self.webcall.toggleMute(false);
                    $(this).parent().find('.fa-microphone-slash').attr('class', 'fa fa-microphone');
                }
            }, {
                iconCls: 'fa fa-pause',
                handler: function() {
                    self.stop();
                    self.webcall.toggleMute(false);
                    $(this).parent().find('.fa-microphone-slash').attr('class', 'fa fa-microphone');
                }
            }, {
                iconCls: 'fa fa-microphone',
                handler: function() {
                    var mute = self.webcall.toggleMute();
                    if (mute) {
                        $(this).attr('class', 'fa fa-microphone-slash');
                    }
                    else {
                        $(this).attr('class', 'fa fa-microphone');
                    }
                }
            }]
        });
    },
    play: function() {
        var peer = "webcam-" + app.content.vision.get('student')._id;
        this.webcall.call(peer);
    },
    stop: function() {
        this.webcall.stop();
    }
});
//
// Screen view
//
var ScreenView = Backbone.View.extend({
    initialize: function() {
        this.prefix = "screen-";
        this._VideoInput = this.$(".video-input");
        this._VideoOutput = this.$(".video-output");
        var videoInput = this._VideoInput.get(0);
        var videoOutput = this._VideoOutput.get(0);
        // Settings
        var resolution = app.settings.get('screen-resolution');
        resolution = resolution ? resolution.get('value').split('x') : [1280, 720];
        var fps = app.settings.get('screen-fps');
        fps = fps ? fps.get('value') : 15;
        var sourceId = app.settings.get('screen-id');
        sourceId = sourceId ? sourceId.get('value') : 'screen:0';
        var constraints = {
            audio: false,
            video: {
                mandatory: {
                    maxWidth: resolution[0],
                    maxHeight: resolution[1],
                    maxFrameRate: fps,
                    minFrameRate: 1
                }
            }
        };
        if (videoInput) {
            constraints.video.mandatory.chromeMediaSource = 'desktop';
            constraints.video.mandatory.chromeMediaSourceId = sourceId;
        }
        this.webcall = new Webcall({
            socket: app.io.screen,
            constraints: constraints,
            input: videoInput,
            output: videoOutput,
            userid: "screen-" + app.profile.get('_id')
        });
    },
    destroy: function() {
        if (this.webcall) this.webcall.destroy();
        this.remove();
    },
    toolbar: function() {
        var self = this;
        this.$el.panel({
            tools: [{
                iconCls: 'fa fa-play',
                handler: function() {
                    self.play();
                }
            }, {
                iconCls: 'fa fa-pause',
                handler: function() {
                    self.stop();
                }
            }]
        });
    },
    play: function() {
        var peer = "screen-" + app.content.vision.get('student')._id;
        this.webcall.call(peer);
    },
    stop: function() {
        this.webcall.stop();
    }
});
//
// Schedule view
//
var ScheduleView = Backbone.View.extend({
    initialize: function() {
        // Variables
        var self = this;
        this.historyFlag = false;
        // jQuery selectors
        this._Menu = $('#main-menu');
        this._TimeWidget = this.$('.time-widget');
        this._CountdownWidget = this.$('.countdown-widget');
        this._StartBtn = this.$('.start-btn');
        this._Grid = this.$('.exams-table');
        // Event handlers
        this._Menu.menu({
            onClick: function(item) {
                switch (item.name) {
                    case "refresh":
                        self.refreshTable();
                        break;
                    case "history":
                        self.toggleHostory(item);
                        break;
                    case "profile":
                        self.view.profile.doOpen();
                        break;
                    case "settings":
                        self.view.settings.doOpen();
                        break;
                    case "logout":
                        app.logout();
                        break;
                }
            }
        });
        // Sub views
        this.view = {
            settings: new SettingsView(),
            profile: new ProfileView()
        };
        // Timers
        this.timer = moment(0);
        // Current time timer
        var t1 = setInterval(function() {
            self._TimeWidget.text(moment().format('HH:mm:ss'));
        }, 1000);
        // Countdown timer
        var t2 = setInterval(function() {
            if (!self.beginDate) return;
            var diff = self.beginDate.diff();
            if (diff < 0) {
                diff = 0;
                self._StartBtn.linkbutton('enable');
                self._StartBtn.css({
                    color: 'green'
                });
                self._StartBtn.click(function() {
                    self.doStart();
                });
                //clearInterval(t2);
            }
            self._CountdownWidget.text(moment(diff).utc().format('HH:mm:ss'));
        }, 1000);
        this.timers = [t1, t2];
        // Rendering
        this.render();
    },
    render: function() {
        var self = this;
        this._Grid.datagrid({
            columns: [
                [{
                    field: 'examId',
                    title: 'ID',
                    width: 60
                }, {
                    field: 'subject',
                    title: 'Экзамен',
                    width: 200,
                    formatter: self.formatSubject
                }, {
                    field: 'beginDate',
                    title: 'Время начала',
                    width: 150,
                    formatter: self.formatDate
                }, {
                    field: 'duration',
                    title: 'Длительность',
                    width: 100,
                    formatter: self.formatDuration
                }]
            ],
            url: '/student',
            method: 'get',
            queryParams: {
                history: this.isHistory()
            },
            onLoadSuccess: function(data) {
                if (data.rows.length > 0) {
                    var first = data.rows[0];
                    if (moment(first.endDate).diff() > 0) {
                        self.beginDate = moment(first.beginDate);
                        self.examId = first._id;
                    }
                }
            },
            rowStyler: function(index, row) {
                var beginDate = moment(row.beginDate);
                var endDate = moment(row.endDate);
                if (beginDate <= moment() && endDate > moment()) {
                    return 'background-color:#ccffcc;color:black';
                }
                else if (endDate < moment()) {
                    return 'background-color:#eee;color:black';
                }
                else {
                    return 'background-color:white;color:black';
                }
            }
        });
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        this.remove();
    },
    isHistory: function() {
        return this.historyFlag ? 1 : 0;
    },
    toggleHostory: function(item) {
        this.historyFlag = !this.historyFlag;
        if (this.historyFlag) {
            this._Menu.menu('setIcon', {
                target: item.target,
                iconCls: 'fa fa-dot-circle-o'
            });
        }
        else {
            this._Menu.menu('setIcon', {
                target: item.target,
                iconCls: 'fa fa-circle-o'
            });
        }
        this._Grid.datagrid('load', {
            history: this.isHistory()
        });
    },
    refreshTable: function() {
        this._Grid.datagrid('reload');
    },
    doStart: function() {
        app.router.navigate("student/" + this.examId, {
            trigger: true
        });
    },
    formatDuration: function(val, row) {
        if (row.beginDate == null) return null;
        var beginDate = moment(row.beginDate);
        var endDate = moment(row.endDate);
        var duration = endDate - beginDate;
        return moment(duration).utc().format('HH:mm');
    },
    formatDate: function(val, row) {
        if (val == null) return null;
        else {
            var d = new Date(val);
            return moment(d).format('DD.MM.YYYY HH:mm');
        }
    },
    formatSubject: function(val, row) {
        if (val == null) return null;
        return val.title + " (" + val.code + ")";
    }
});
//
// Student view
//
var StudentView = Backbone.View.extend({
    events: {
        "click .finish-btn": "doFinish"
    },
    initialize: function() {
        // Variables
        var self = this;
        // jQuery selectors
        this._Menu = $('#main-menu');
        this._NetworkWidget = this.$('.network-widget');
        this._TimeWidget = this.$('.time-widget');
        this._DurationWidget = this.$('.duration-widget');
        this._StudentWidget = this.$('.student-widget');
        this._CuratorWidget = this.$('.curator-widget');
        this._ObserversWidget = this.$('.observers-widget');
        this._FinishBtn = this.$('.finish-btn');
        this._DialogExam = $('#exam-info-dlg');
        this._ExamInfoTpl = $("#exam-info-tpl");
        // Event handlers
        this._Menu.menu({
            onClick: function(item) {
                switch (item.name) {
                    case "info":
                        self.showExamInfo();
                        break;
                    case "profile":
                        self.view.profile.doOpen();
                        break;
                    case "settings":
                        self.view.settings.doOpen();
                        break;
                    case "logout":
                        app.logout();
                        break;
                }
            }
        });
        // Sub views
        this.view = {
            settings: new SettingsView(),
            profile: new ProfileView(),
            chat: new ChatView({
                el: $("#panel-chat"),
                id: 'chat-' + self.id
            }),
            webcam: new WebcamView({
                el: $("#panel-webcam"),
                id: 'webcam-' + self.id
            }),
            screen: new ScreenView({
                el: $("#panel-screen"),
                id: 'screen-' + self.id
            })
        };
        // Resize widgets
        var resizeWidget = function(container, pobj) {
            var p = pobj.panel('panel');
            p.detach().appendTo(container).css({
                position: 'absolute',
                top: 0,
                left: 0
            });
            pobj.panel('resize', {
                width: container.width(),
                height: container.height()
            });
            pobj.find('video').each(function(index, element) {
                if (element.src != '') {
                    element.play();
                }
                if (element.className == 'videoInput') {
                    element.style.left = '';
                    element.style.bottom = '';
                    element.style.top = '5px';
                    element.style.right = '5px';
                }
            });
        }
        this.$(".ws-widget").each(function(index, element) {
            var wsWidget = $(element);
            var wsContent = self.$(".ws-content");
            var wsPanel = wsWidget.find(".ws-panel");
            wsPanel.panel({
                onMaximize: function() {
                    resizeWidget(wsContent, wsPanel);
                },
                onRestore: function() {
                    resizeWidget(wsWidget, wsPanel);
                }
            });
        });
        // Timers
        this.timer = moment(0);
        var t1 = setInterval(function() {
            self.timer.add(1, 'seconds');
            self._DurationWidget.text(self.timer.utc().format('HH:mm:ss'));
            var nowDate = moment();
            var endDate = moment(self.student.get("endDate"));
            if (endDate.diff(nowDate, 'minutes') <= 5) self._DurationWidget.css('color', 'red');
            else if (endDate.diff(nowDate, 'minutes') <= 15) self._DurationWidget.css('color', 'orange');
        }, 1000);
        var t2 = setInterval(function() {
            self._TimeWidget.text(moment().format('HH:mm:ss'));
        }, 1000);
        this.timers = [t1, t2];
        // Student model
        var Student = Backbone.Model.extend({
            urlRoot: '/student'
        });
        this.student = new Student({
            id: this.id
        });
        this.listenTo(this.student, 'change', this.render);
        this.student.fetch();
        // Socket notification
        app.io.notify.on('update-' + this.id, function(data) {
            self.student.fetch();
        });
    },
    render: function() {
        var startDate = this.student.get("startDate");
        var duration = moment() - moment(startDate);
        if (duration > 0) this.timer = moment(duration);
        var curator = this.student.get("curator");
        if (curator[0]) {
            var amount = curator.length - 1;
            var observers = "Наблюдатели не подключены";
            if (amount > 0) {
                observers = '<div style="font-weight:bold">Наблюдатели:</div>';
                for (var i = 1; i <= amount; i++) {
                    observers += '<div><i class="fa fa-caret-right"></i> ' + curator[i].lastname + ' ' + curator[i].firstname + ' ' + curator[i].middlename + '</div>';
                }
            }
            this._CuratorWidget.text(curator[0].lastname + " " + curator[0].firstname + " " + curator[0].middlename + " (" + amount + ")");
            var delta = -1 * this._ObserversWidget.width() / 2 + 5;
            this._ObserversWidget.tooltip({
                deltaX: delta,
                content: observers
            });
        }
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        if (this.view.chat) this.view.chat.destroy();
        if (this.view.webcam) this.view.webcam.destroy();
        if (this.view.screen) this.view.screen.destroy();
        app.io.notify.removeListener('update-' + this.id);
        this.remove();
    },
    showExamInfo: function() {
        var tpl = _.template(this._ExamInfoTpl.html());
        var student = this.student.toJSON();
        var html = tpl(student);
        this._DialogExam.html(html);
        this._DialogExam.dialog('open');
    },
    doFinish: function() {
        $.messager.confirm('Завершить экзамен', 'Завершить текущий экзамен?', function(r) {
            if (r) {
                app.router.navigate("schedule", {
                    trigger: true
                });
            }
        });
    }
});
//
// Settings view
//
var SettingsView = Backbone.View.extend({
    tagName: 'div',
    initialize: function() {
        var self = this;
        var dialog = $(this.el).dialog({
            title: 'Настройки',
            width: 500,
            height: 400,
            closed: true,
            modal: true,
            href: '/templates/settings.tpl',
            onLoad: function() {
                self.render();
            },
            buttons: [{
                text: 'Сохранить',
                iconCls: 'fa fa-check',
                handler: function() {
                    self.doSave();
                }
            }, {
                text: 'Отменить',
                iconCls: 'fa fa-times',
                handler: function() {
                    self.doClose();
                }
            }]
        });
        this._Dialog = $(dialog);
    },
    render: function() {
        function getMediaSources(kind, callback) {
            MediaStreamTrack.getSources(function(sources) {
                var mediaSources = [];
                for (var i = 0, l = sources.length; i < l; i++) {
                    var source = sources[i];
                    if (source.kind == kind) {
                        mediaSources.push({
                            name: source.id,
                            value: source.label || 'Неизвестный источник ' + (i + 1)
                        });
                    }
                }
                if (callback) callback(mediaSources);
            });
        };
        this._ScreenBtn = this.$('.screen-btn');
        this._WebcameraAudio = this.$('.webcamera-audio');
        this._WebcameraVideo = this.$('.webcamera-video');
        this._SettingsForm = this.$('.settings-form');
        this._ScreenBtn.click(function() {
            console.log('postMessage chooseSreenId');
            parent.postMessage('chooseSreenId', '*');
        });
        var self = this;

        function loadForm() {
            self._SettingsForm.form('load', app.settings.load());
        }
        getMediaSources('audio', function(sources) {
            self._WebcameraAudio.combobox({
                data: sources
            });
            loadForm();
        });
        getMediaSources('video', function(sources) {
            self._WebcameraVideo.combobox({
                data: sources
            });
            loadForm();
        });
    },
    doOpen: function() {
        this.render();
        this._Dialog.dialog('open');
    },
    doSave: function() {
        this.doClose();
        var formData = this._SettingsForm.serializeArray();
        app.settings.save(formData);
    },
    doClose: function() {
        this._Dialog.dialog('close');
    }
});
//
// Profile view
//
var ProfileView = Backbone.View.extend({
    tagName: 'div',
    initialize: function() {
        var self = this;
        var dialog = $(this.el).dialog({
            title: 'Профиль пользователя',
            width: 550,
            height: 250,
            closed: true,
            modal: true,
            href: '/templates/profile.tpl',
            onLoad: function() {
                self.render(this);
            }
        });
        this._Dialog = $(dialog);
    },
    render: function(obj) {
        this._ProfileTpl = $("#profile-tpl");
        var tpl = _.template(this._ProfileTpl.html());
        var profile = {
            user: app.profile.toJSON()
        };
        var html = tpl(profile);
        this.$('.profile-view').html(html);
    },
    doOpen: function() {
        this._Dialog.dialog('open');
    },
    doClose: function() {
        this._Dialog.dialog('close');
    }
});
//
// Application view
//
var AppView = Backbone.View.extend({
    initialize: function() {
        app = this;
        var url = window.location.host;
        this.profile = new Profile();
        this.settings = new Settings();
        this.io = {
            notify: io.connect(url + '/notify'),
            call: io.connect(url + '/call'),
            screen: io.connect(url + '/screen')
        };
        this.router = new Workspace();
        Backbone.history.start();
    },
    render: function(url, callback) {
        this.$el.html('<div id="content" class="easyui-panel" data-options="fit:true,border:false">');
        this.$('#content').panel({
            href: url,
            onLoad: function() {
                if (callback) callback();
            }
        });
    },
    logout: function() {
        if (this.profile.logout()) {
            this.router.navigate("login", {
                trigger: true
            });
        }
    }
});
//
// Application start
//
$(document).ready(function() {
    new AppView({
        el: $("body")
    });
});