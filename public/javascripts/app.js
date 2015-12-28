//
// Global initialize
//
var app;
var SINGLE_MODE = false;
var UPLOAD_LIMIT = 10; // MB
var TX_MIN = 1; // Mbps
var RX_MIN = 1; // Mbps
var OFFSET = 0; // hours
var REQUEST_INTERVAL = 60; // seconds
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
        }).done(function(user, status, xhr) {
            self.clear().set(user);
            result = true;
            app.serverTime.syncTime();
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
        }).done(function(user, status, xhr) {
            self.clear().set(user);
            result = true;
            app.serverTime.syncTime();
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
// ServerTime model
//
var ServerTime = Backbone.Model.extend({
    urlRoot: '/tools/time',
    initialize: function(options) {
        var self = this;
        this.options = options || {};
        if (this.options.time) this._ticker = this.options.time;
        else this._ticker = Date.now();
        this._timer = setInterval(function() {
            self.onTick();
        }, 1000);
    },
    destroy: function() {
        if (this._timer) clearInterval(this._timer);
    },
    syncTime: function() {
        var self = this;
        var clientTime = Date.now();
        this.fetch({
            async: false,
            data: {
                client: clientTime
            },
            success: function(model, response, options) {
                self._ticker = model.get("serverTime");
                var delay = Math.floor((Date.now() - clientTime) / 2);
                self._ticker += delay;
            }
        });
    },
    onTick: function() {
        this._ticker += 1000;
    },
    now: function() {
        return moment(this._ticker);
    }
});
//
// Webcall model
//
var Webcall = Backbone.Model.extend({
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
var Router = Backbone.Router.extend({
    routes: {
        "login": "login",
        "monitor": "monitor",
        "vision/:examid": "vision",
        "play/:examid": "play",
        "schedule": "schedule",
        "exam/:examid": "exam",
        "admin": "admin",
        "*path": "main"
    },
    main: function() {
        if (app.profile.isAuth()) {
            app.connect({
                'forceNew': true
            });
            var role = app.profile.get("role");
            var navigate = "login";
            switch (role) {
                case 1:
                    navigate = "schedule";
                    break;
                case 2:
                    navigate = "monitor";
                    break;
                case 3:
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
        app.render("/templates/login.html", function() {
            var view = new LoginView({
                el: $("#login-view")
            });
            app.content = view;
        });
    },
    monitor: function() {
        console.log("route: #monitor");
        if (this.redirect()) return;
        this.destroy();
        app.render("/templates/monitor.html", function() {
            var view = new MonitorView({
                el: $("#monitor-view")
            });
            app.content = view;
        });
    },
    vision: function(examid) {
        console.log("route: #vision");
        if (this.redirect()) return;
        this.destroy();
        app.render("/templates/vision.html", function() {
            var view = new VisionView({
                el: $("#vision-view"),
                examId: examid
            });
            app.content = view;
        });
    },
    schedule: function() {
        console.log("route: #schedule");
        if (this.redirect()) return;
        this.destroy();
        app.render("/templates/schedule.html", function() {
            var view = new ScheduleView({
                el: $("#schedule-view")
            });
            app.content = view;
        });
    },
    exam: function(examid) {
        console.log("route: #exam");
        if (this.redirect()) return;
        this.destroy();
        app.render("/templates/exam.html", function() {
            var view = new ExamView({
                el: $("#exam-view"),
                examId: examid
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
        this._Form = this.$("form#auth-plain");
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
        this._TimeWidget = this.$(".time-widget");
        this._LoguserWidget = this.$(".loguser-widget");
        this._Dialog = $("#schedule-dlg");
        this._DialogGrid = this._Dialog.find(".easyui-datagrid");
        this._DialogFrom = this._Dialog.find("#schedule-from");
        this._DialogTo = this._Dialog.find("#schedule-to");
        this._DialogConcurrent = this._Dialog.find(".schedule-concurrent");
        // Event handlers
        this._Menu.menu({
            onClick: function(item) {
                switch (item.name) {
                    case "schedule":
                        self._Dialog.dialog('open');
                        break;
                    case "profile":
                        self.view.profile.doOpen();
                        break;
                    case "settings":
                        self.view.settings.doOpen();
                        break;
                    case "demo":
                        self.view.demo.doOpen();
                        break;
                    case "logout":
                        app.logout();
                        break;
                }
            }
        });
        this._Dialog.dialog({
            buttons: [{
                text: 'Добавить',
                iconCls: 'fa fa-plus',
                handler: function() {
                    var fromDate = self._DialogFrom.datetimebox('getValue');
                    var toDate = self._DialogTo.datetimebox('getValue');
                    var concurrent = self._DialogConcurrent.numberspinner('getValue');
                    if (fromDate && toDate && concurrent) {
                        self._DialogGrid.datagrid('appendRow', {
                            beginDate: moment(fromDate, 'DD.MM.YYYY HH:mm:ss'),
                            endDate: moment(toDate, 'DD.MM.YYYY HH:mm:ss'),
                            concurrent: concurrent
                        });
                    }
                }
            }, {
                text: 'Сохранить',
                iconCls: 'fa fa-floppy-o',
                handler: function() {
                    var addedRows = self._DialogGrid.datagrid('getChanges');
                    addedRows.forEach(function(element, index, array) {
                        self.schedules.create({
                            beginDate: element.beginDate,
                            endDate: element.endDate,
                            concurrent: element.concurrent
                        }, {
                            success: function(model) {
                                self._DialogGrid.datagrid('reload');
                            }
                        });
                    });
                }
            }, {
                text: 'Закрыть',
                iconCls: 'fa fa-times',
                handler: function() {
                    self._Dialog.dialog('close');
                }
            }],
            onOpen: function() {
                self._DialogGrid.datagrid({
                    url: '/schedule'
                });
                $(this).dialog('center');
            }
        });
        this._DialogFrom.datetimebox({
            formatter: function(date) {
                date = moment(date).startOf('hour');
                return date.format("DD.MM.YYYY HH:mm");
            }
        });
        this._DialogTo.datetimebox({
            formatter: function(date) {
                date = moment(date).startOf('hour');
                return date.format("DD.MM.YYYY HH:mm");
            }
        });
        this._DialogFrom.datetimebox('calendar').calendar({
            validator: function(date) {
                var now = app.now().startOf('day');
                return date >= now;
            }
        });
        this._DateSearch.datebox({
            value: app.now().format("DD.MM.YYYY"),
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
            profile: new ProfileView(),
            info: new InfoView(),
            demo: new DemoView(),
            passport: new PassportView()
        };
        // Timers
        var t1 = setInterval(function() {
            self._TimeWidget.text(app.now().format('HH:mm:ss'));
        }, 1000);
        var t2 = setInterval(function() {
            var rows = self._Grid.datagrid('getRows');
            if (rows) {
                if (!this.nextRow || this.nextRow >= rows.length) this.nextRow = 0;
                var row = rows[this.nextRow];
                if (row) {
                    var updatedRow = self.lastUpdated[row._id];
                    if (updatedRow) {
                        self._Grid.datagrid('updateRow', {
                            index: this.nextRow,
                            row: updatedRow
                        });
                        self._Grid.datagrid('highlightRow', this.nextRow);
                        delete self.lastUpdated[row._id];
                    }
                    else {
                        self._Grid.datagrid('refreshRow', this.nextRow);
                    }
                }
                this.nextRow++;
            }
        }, 1000);
        /*
        var t3 = setInterval(function() {
            if (!self.lastUpdated) return;
            var rows = self._Grid.datagrid('getRows');
            for (var i = 0, li = rows.length; i < li; i++) {
                var updatedRow = self.lastUpdated[rows[i]._id];
                if (updatedRow) {
                    //console.log(self._Grid.datagrid('getRowIndex', rows[i]));
                    console.log(updatedRow);
                    self._Grid.datagrid('updateRow', {
                        index: i,
                        row: updatedRow
                    });
                }
            }
            self.lastUpdated = {};
        }, 30000);
        */
        this.timers = [t1, t2];
        // Monitor model
        var Monitor = Backbone.Model.extend({
            idAttribute: '_id',
            urlRoot: '/inspector'
        });
        this.monitor = new Monitor();
        // Schedule model
        var Schedule = Backbone.Model.extend({
            idAttribute: "_id"
        });
        var ScheduleList = Backbone.Collection.extend({
            url: '/schedule',
            model: Schedule
        });
        this.schedules = new ScheduleList();
        // Socket events
        this.lastUpdated = {};
        app.io.notify.on('exam', function(data) {
            if (!data) return;
            self.lastUpdated[data._id] = data;
        });
        // Rendering
        this.render();
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        for (var v in this.view) {
            if (this.view[v]) this.view[v].destroy();
        }
        this.remove();
    },
    render: function() {
        var self = this;
        var now = app.now();
        this._Grid.datagrid({
            columns: [
                [{
                    field: 'student',
                    title: 'Студент',
                    width: 150,
                    formatter: self.formatStudent
                }, {
                    field: 'inspector',
                    title: 'Инспектор',
                    width: 150,
                    formatter: self.formatInspector
                }, {
                    field: 'subject',
                    title: 'Экзамен',
                    width: 200,
                    sortable: true,
                    formatter: self.formatSubject
                }, {
                    field: 'beginDate',
                    title: 'Начало',
                    width: 150,
                    sortable: true,
                    formatter: self.formatDate
                }, {
                    field: 'duration',
                    title: 'Длительность',
                    width: 100,
                    formatter: self.formatDuration
                }, {
                    field: 'status',
                    title: 'Статус',
                    width: 100,
                    formatter: self.formatStatus
                }, {
                    field: 'action',
                    title: '&nbsp;&nbsp;&nbsp;&nbsp;',
                    align: 'center',
                    formatter: self.formatAction
                }]
            ],
            rownumbers: true,
            remoteSort: false,
            url: '/inspector',
            method: 'get',
            queryParams: {
                from: now.startOf('day').toJSON(),
                to: now.startOf('day').add(1, 'days').toJSON()
            },
            onLoadSuccess: function() {
                self.lastUpdated = {};
            }
        });
        this._DialogGrid.datagrid({
            columns: [
                [{
                    field: 'beginDate',
                    title: 'Начало',
                    width: 200,
                    formatter: self.formatDate
                }, {
                    field: 'endDate',
                    title: 'Окончание',
                    width: 200,
                    formatter: self.formatDate
                }, {
                    field: 'concurrent',
                    title: 'Кол-во сессий',
                    width: 150
                }]
            ],
            method: 'get'
        });
        this._LoguserWidget.text(app.profile.get("lastname") + " " + app.profile.get("firstname") + " " + app.profile.get("middlename") + " (" + app.profile.get("roleName") + ")");
    },
    formatStatus: function(val, row) {
        var status = 0;
        var now = app.now();
        if (row.rightDate) {
            var rightDate = moment(row.rightDate);
            if (rightDate <= now) status = 6;
        }
        if (row.beginDate && row.endDate) {
            var beginDate = moment(row.beginDate);
            var endDate = moment(row.endDate);
            if (beginDate > now) status = 1;
            if (endDate <= now) status = 6;
            if (beginDate <= now && endDate > now) status = 2;
            if (row.startDate) status = 3;
            if (row.resolution === true) status = 4;
            if (row.resolution === false) status = 5;
        }
        switch (status) {
            case 0:
                return '<span style="color:olive;">Не запланирован</span>';
            case 1:
                return '<span style="color:teal;">Запланирован</span>';
            case 2:
                return '<span style="color:orange;">Ожидает</span>';
            case 3:
                return '<span style="color:red;">Идет</span>';
            case 4:
                return '<span style="color:green;">Сдан</span>';
            case 5:
                return '<span style="color:purple;">Прерван</span>';
            case 6:
                return '<span style="color:gray;">Пропущен</span>';
            default:
                return null;
        }
    },
    formatAction: function(val, row) {
        if (!row.beginDate) return;
        var html = $('#action-item-tpl').html();
        var tpl = _.template(html);
        var now = app.now();
        var beginDate = moment(row.beginDate);
        var isAllow = function() {
            var allow = false;
            if (beginDate <= now && row.startDate && !row.stopDate) {
                allow = true;
            }
            return allow;
        };
        var data = {
            examId: row._id
        };
        return isAllow() ? tpl(data) : null;
    },
    formatDuration: function(val, row) {
        if (!val) return;
        return val + ' мин.';
    },
    formatDate: function(val, row) {
        if (!val) return;
        return moment(val).format('DD.MM.YYYY HH:mm');
    },
    formatSubject: function(val, row) {
        if (!val || !row) return;
        var html = $('#subject-item-tpl').html();
        var tpl = _.template(html);
        return tpl({
            examId: row._id,
            subject: val
        });
    },
    formatStudent: function(val, row) {
        if (!val) return;
        var data = {
            userId: val._id,
            lastname: val.lastname,
            firstname: val.firstname,
            middlename: val.middlename
        };
        var html = $('#student-item-tpl').html();
        var tpl = _.template(html);
        return tpl(data);
    },
    formatInspector: function(val, row) {
        if (!val) return;
        var data = {
            userId: val._id,
            lastname: val.lastname,
            firstname: val.firstname,
            middlename: val.middlename
        };
        var html = $('#inspector-item-tpl').html();
        var tpl = _.template(html);
        return tpl(data);
    },
    doSearch: function() {
        var any = 0;
        switch (true) {
            case this._StatusBtn1.linkbutton('options').selected:
                any = 0;
                break;
            case this._StatusBtn2.linkbutton('options').selected:
                any = 1;
                break;
        }
        var text = this._TextSearch.textbox('getValue');
        var date = this._DateSearch.datebox('getValue');
        var fromDate = date ? moment(date, 'DD.MM.YYYY').toJSON() : null;
        var toDate = date ? moment(date, 'DD.MM.YYYY').add(1, 'days').toJSON() : null;
        this._Grid.datagrid('load', {
            any: any,
            from: fromDate,
            to: toDate,
            text: text
        });
    },
    doReload: function() {
        this._Grid.datagrid('reload');
    },
    doExamInfo: function(examId) {
        this.view.info.doOpen(examId);
    },
    doStudentInfo: function(userId) {
        this.view.passport.doOpen(userId);
    },
    doInspectorInfo: function(userId) {
        this.view.profile.doOpen(userId);
    },
    doPlay: function(examId) {
        if (SINGLE_MODE) {
            app.router.navigate("vision/" + examId, {
                trigger: true
            });
        }
        else {
            window.open("#/vision/" + examId, examId);
        }
    }
});
//
// Vision view
//
var VisionView = Backbone.View.extend({
    events: {
        "click .verify-btn": "doVerify",
        "click .screenshot-btn": "doScreenshot",
        "click .exam-stop-btn": "rejectExam",
        "click .exam-apply-btn": "applyExam"
    },
    initialize: function(options) {
        // Variables
        var self = this;
        this.options = options || {};
        this.protectionCode = null;
        this.automuteFlag = false;
        // jQuery selectors
        this._Menu = $('#main-menu');
        this._Webcam = this.$('.panel-webcam');
        this._Screen = this.$('.panel-screen');
        this._Chat = this.$('.panel-chat');
        this._Notes = this.$('.panel-notes');
        this._Members = this.$('.panel-members');
        this._NetworkWidget = this.$('.network-widget');
        this._TimeWidget = this.$('.time-widget');
        this._DurationWidget = this.$('.duration-widget');
        this._ExamWidget = this.$('.exam-widget');
        this._DialogScreenshot = $("#screenshot-dlg");
        this._ScreenshotPreview = this._DialogScreenshot.find('img');
        this._ScreenshotComment = this._DialogScreenshot.find('.screenshot-comment');
        this._DialogConfirm = $("#exam-confirm-dlg");
        this._ProtectionCode = this._DialogConfirm.find('.protection-code');
        this._ProtectionCodeInput = this._DialogConfirm.find('.protection-code-input');
        this._ExamComment = this._DialogConfirm.find('.exam-comment');
        this._ApplyText = this._DialogConfirm.find('.apply-text');
        this._RejectText = this._DialogConfirm.find('.reject-text');
        this._VerifyBtn = this.$('.verify-btn');
        this._DialogVerify = $("#verify-dlg");
        this._Video = this.$('.panel-webcam > .video-output');
        this._StudentPhoto = this._DialogVerify.find('.student-photo');
        this._StudentVideo = this._DialogVerify.find('.student-video');
        this._Passport = this._DialogVerify.find('.verify-data');
        // Event handlers
        this._Menu.menu({
            onClick: function(item) {
                switch (item.name) {
                    case "info":
                        self.view.info.doOpen(self.options.examId);
                        break;
                    case "passport":
                        var student = self.model.get('student');
                        if (student) self.view.passport.doOpen(student._id);
                        break;
                    case "automute":
                        self.toggleAutomute(item);
                        break;
                    case "profile":
                        self.view.profile.doOpen();
                        break;
                    case "disconnect":
                        self.disconnect();
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
                if (element.className == 'video-input') {
                    element.style.left = '';
                    element.style.bottom = '';
                    element.style.top = '5px';
                    element.style.right = '5px';
                }
            });
        };
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
            idAttribute: '_id',
            urlRoot: '/inspector'
        });
        this.model = new Vision({
            _id: this.options.examId
        });
        this.listenTo(this.model, 'change', this.render);
        // Sub views
        this.view = {
            profile: new ProfileView(),
            passport: new PassportView(),
            info: new InfoView(),
            notes: new NotesView({
                el: this._Notes.get(0),
                examId: this.options.examId
            }),
            chat: new ChatView({
                el: this._Chat.get(0),
                examId: this.options.examId
            }),
            members: new MembersView({
                el: this._Members.get(0),
                examId: this.options.examId
            }),
            webcam: new WebcamView({
                el: this._Webcam.get(0),
                examId: this.options.examId,
                userId: app.profile.get('_id')
            }),
            screen: new ScreenView({
                el: this._Screen.get(0),
                examId: this.options.examId,
                userId: app.profile.get('_id')
            })
        };
        this.view.webcam.toolbar();
        this.view.screen.toolbar();
        // Window events
        this.messageEventHandler = function(event) {
            var message = event.data;
            switch (message.id) {
                case 'screenshot':
                    self.screenshotDlg(message.data);
                    break;
            }
        };
        this.focusEventHandler = function(event) {
            self.view.webcam.mute(false);
        };
        this.blurEventHandler = function(event) {
            self.view.webcam.mute(true);
        };
        window.addEventListener('message', this.messageEventHandler);
        // Socket events
        this.connectHandler = function(data) {
            self._NetworkWidget.html('В сети');
            self._NetworkWidget.css('color', 'green');
        };
        this.disconnectHandler = function(data) {
            self._NetworkWidget.html('Не в сети');
            self._NetworkWidget.css('color', 'red');
        };
        app.io.notify.on('connect', this.connectHandler);
        app.io.notify.on('disconnect', this.disconnectHandler);
        // Timers
        var t1 = setInterval(function() {
            var now = app.now();
            self._TimeWidget.text(now.format('HH:mm:ss'));
            var startDate = self.model.get('startDate');
            if (startDate) {
                var diff = now.diff(startDate);
                if (diff < 0) diff = 0;
                var timer = moment(diff);
                self._DurationWidget.text(timer.utc().format('HH:mm:ss'));
            }
            var endDate = self.model.get('endDate');
            if (endDate) {
                if (moment(endDate).diff(now, 'minutes') <= 5)
                    self._DurationWidget.css('color', 'red');
                else if (moment(endDate).diff(now, 'minutes') <= 15)
                    self._DurationWidget.css('color', 'orange');
            }
        }, 1000);
        var t2 = setInterval(function() {
            var student = self.model.get('student');
            if (student && student.provider) {
                self.getExamStatus();
            }
        }, REQUEST_INTERVAL * 1000);
        this.timers = [t1, t2];
        // Start exam
        this.model.fetch();
    },
    render: function() {
        var subject = this.model.get('subject');
        this._ExamWidget.text(subject);
        this._DurationWidget.css('color', '');
        if (this.model.get('verified')) this._VerifyBtn.linkbutton('disable');
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        for (var v in this.view) {
            if (this.view[v]) this.view[v].destroy();
        }
        window.removeEventListener('message', this.messageEventHandler);
        window.removeEventListener('focus', this.focusEventHandler);
        window.removeEventListener('blur', this.blurEventHandler);
        app.io.notify.removeListener('connect', this.connectHandler);
        app.io.notify.removeListener('disconnect', this.disconnectHandler);
        this.remove();
    },
    toggleAutomute: function(item) {
        this.automuteFlag = !this.automuteFlag;
        if (this.automuteFlag) {
            window.addEventListener('focus', this.focusEventHandler);
            window.addEventListener('blur', this.blurEventHandler);
            this._Menu.menu('setIcon', {
                target: item.target,
                iconCls: 'fa fa-dot-circle-o'
            });
        }
        else {
            window.removeEventListener('focus', this.focusEventHandler);
            window.removeEventListener('blur', this.blurEventHandler);
            this._Menu.menu('setIcon', {
                target: item.target,
                iconCls: 'fa fa-circle-o'
            });
        }

    },
    getExamStatus: function() {
        var self = this;
        $.getJSON('/inspector/' + this.options.examId + '/status',
            function(data) {
                if (!data) return;
                if (!self.examStatus) self.examStatus = data.status;
                if (data.status != self.examStatus) {
                    self.examStatus = data.status;
                    self.view.notes.collection.create({
                        time: app.now(),
                        text: 'Статус экзамена в LMS изменился: ' + self.examStatus,
                        attach: [],
                        editable: false
                    });
                }
            });
    },
    doVerify: function() {
        if (this.model.get('verified')) return;
        var self = this;
        var timer;
        var paused = false;
        var video = self._Video.get(0);
        var photo = self._StudentPhoto.get(0);
        var canvas = self._StudentVideo.get(0);

        var tpl = _.template($('#verify-tpl').html());
        var html = tpl({
            user: this.model.get('student')
        });
        this._Passport.html(html);

        function playVideo() {
            var context = canvas.getContext('2d');
            var cw = self._Video.width();
            var ch = self._Video.height();
            var proportion = ch / cw;
            //console.log(cw + 'x' + ch);
            cw = 640;
            ch = Math.floor(640 * proportion);
            canvas.width = cw;
            canvas.height = ch;
            timer = setInterval(function() {
                if (paused) return false;
                if (video.paused || video.ended) {
                    return photo.setAttribute('src', video.poster);
                }
                context.drawImage(video, 0, 0, cw, ch);
                if (!photo.src) {
                    photo.setAttribute('src', canvas.toDataURL());
                }
            }, 20);
        }

        function stopVideo() {
            clearInterval(timer);
            timer = null;
            photo.removeAttribute('src');
        }

        function toggleVideo() {
            paused = !paused;
        }

        function saveAttach(callback) {
            var dataUrl = self._StudentVideo.get(0).toDataURL();
            var blobBin = atob(dataUrl.split(',')[1]);
            var array = [];
            for (var i = 0; i < blobBin.length; i++) {
                array.push(blobBin.charCodeAt(i));
            }
            var file = new Blob([new Uint8Array(array)], {
                type: 'image/png'
            });
            var formdata = new FormData();
            formdata.append(0, file, "document.png");
            $.ajax({
                url: "/storage",
                type: "post",
                data: formdata,
                processData: false,
                contentType: false,
            }).done(function(respond) {
                var attach = [];
                attach.push({
                    fileId: respond.fileId,
                    filename: respond.originalname,
                    uploadname: respond.name
                });
                callback(attach);
            });
        }

        function submitData(submit) {
            var student = self.model.get('student');
            var verified = {
                submit: submit,
                data: {
                    firstname: student.firstname,
                    lastname: student.lastname,
                    middlename: student.middlename,
                    gender: student.gender,
                    birthday: student.birthday,
                    citizenship: student.citizenship,
                    documentType: student.documentType,
                    documentNumber: student.documentNumber,
                    documentIssueDate: student.documentIssueDate
                }
            };
            self.model.set('verified', verified);
            $.ajax({
                url: "/inspector/" + self.options.examId,
                type: "post",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify({
                    verified: verified
                })
            }).done(function(respond) {
                var message = submit ? 'Личность студента подтверждена' : 'Личность студента не установлена';
                saveAttach(function(attach) {
                    self.view.notes.collection.create({
                        time: app.now(),
                        text: message,
                        attach: attach,
                        editable: false
                    });
                    self._DialogVerify.dialog('close');
                    self._VerifyBtn.linkbutton('disable');
                });
            });
        }

        function applyBtn() {
            submitData(true);
        }

        function rejectBtn() {
            submitData(false);
        }

        this._DialogVerify.dialog({
            closed: false,
            buttons: [{
                text: 'Cнимок документа',
                iconCls: 'fa fa-clone',
                handler: toggleVideo
            }, {
                text: 'Подтвердить личность',
                iconCls: 'fa fa-check',
                handler: applyBtn
            }, {
                text: 'Личность не установлена',
                iconCls: 'fa fa-times',
                handler: rejectBtn
            }, ],
            onOpen: function() {
                $(this).dialog('center');
                playVideo();
            },
            onClose: stopVideo
        });
    },
    doScreenshot: function() {
        app.postMessage('takeScreenshot', '*');
    },
    screenshotDlg: function(dataUrl) {
        var self = this;
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
                var comment = self._ScreenshotComment.textbox('getValue');
                var attach = [];
                attach.push({
                    fileId: respond.fileId,
                    filename: respond.originalname,
                    uploadname: respond.name
                });
                self.view.notes.collection.create({
                    time: app.now(),
                    text: comment,
                    attach: attach,
                    editable: true
                });
                closeBtn();
            });
        };
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
            }],
            onOpen: function() {
                $(this).dialog('center');
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
                        // Finish exam
                        self.model.save({
                            _id: self.options.examId,
                            resolution: resolution,
                            comment: self._ExamComment.textbox('getValue')
                        }, {
                            success: function() {
                                self._DialogConfirm.dialog('close');
                                self.disconnect();
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
    disconnect: function() {
        if (SINGLE_MODE) {
            app.router.navigate("monitor", {
                trigger: true
            });
        }
        else {
            app.postMessage('closeWindow', '*');
            window.close();
        }
    },
    generateCode: function() {
        var randomizeNumber = function(min, max) {
            return Math.ceil((Math.random() * (max - min)) + min);
        };
        this.protectionCode = randomizeNumber(1000, 9999);
    }
});
//
// Notes view
//
var NotesView = Backbone.View.extend({
    events: {
        "click .note-add-btn": "add",
        "click .attach-link": "doDownload"
    },
    initialize: function(options) {
        // Varialbes
        var self = this;
        this.options = options || {};
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
                this.listenTo(this.model, 'remove', this.remove);
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
                };
                var closeDlg = function() {
                    self.close();
                };
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
                        $(this).dialog('center');
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
        // jQuery selectors
        this._Panel = this.$(".notes-panel");
        this._List = this.$(".notes-list");
        this._Input = this.$(".note-input");
        // DOM events
        this._Input.textbox('textbox').bind('keypress', function(e) {
            if (e.keyCode == 13) self.add();
        });
        // Note model
        var Note = Backbone.Model.extend({
            idAttribute: "_id"
        });
        // Notes collection
        var NotesList = Backbone.Collection.extend({
            url: '/notes/' + this.options.examId,
            model: Note,
            comparator: 'time'
        });
        this.collection = new NotesList();
        this.listenTo(this.collection, 'add', this.appendItem);
        this.collection.fetch();
        // Socket notification
        app.io.notify.on('notes-' + this.options.examId, function(data) {
            if (!app.profile.isMe(data.userId)) {
                self.collection.fetch();
            }
        });
    },
    destroy: function() {
        app.io.notify.removeListener('notes-' + this.options.examId);
        this.remove();
    },
    add: function() {
        var noteText = this._Input.textbox('getValue');
        if (!noteText) return;
        this.collection.create({
            time: app.now(),
            text: noteText,
            attach: [],
            editable: true
        });
        this._Input.textbox('setValue', '');
    },
    appendItem: function(model) {
        var view = new this.ItemView({
            model: model
        });
        this._List.append(view.render().el);
        this._Panel.scrollTop(this._Panel[0].scrollHeight);
    },
    doDownload: function(e) {
        return _.isHttpStatusOK(e.currentTarget.href);
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
        "change .chat-attach-input": "doFileChange",
        "click .attach-link": "doDownload"
    },
    initialize: function(options) {
        // Variables
        var self = this;
        this.options = options || {};
        this.attach = [];
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
        // jQuery selectors
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
        // Chat model
        var Chat = Backbone.Model.extend({
            idAttribute: "_id"
        });
        // Chat collection
        var ChatList = Backbone.Collection.extend({
            url: '/chat/' + this.options.examId,
            model: Chat,
            comparator: 'time'
        });
        this.collection = new ChatList();
        this.listenTo(this.collection, 'add', this.appendItem);
        this.collection.fetch({
            success: function(model, response, options) {
                var text = 'подключился к экзамену...';
                self.createMessage(text);
            }
        });
        // Audio notification
        this.audio = new Audio("/sounds/alert.ogg");
        // Socket notification
        app.io.notify.on('chat-' + this.options.examId, function(data) {
            if (!app.profile.isMe(data.userId)) {
                self.collection.fetch({
                    success: function() {
                        self.audio.play();
                    }
                });
            }
        });
    },
    destroy: function() {
        app.io.notify.removeListener('chat-' + this.options.examId);
        this.remove();
    },
    createMessage: function(text) {
        var author = {
            _id: app.profile.get('_id'),
            lastname: app.profile.get('lastname'),
            firstname: app.profile.get('firstname'),
            middlename: app.profile.get('middlename')
        };
        this.collection.create({
            time: app.now(),
            author: author,
            text: text,
            attach: this.attach
        });
    },
    doSend: function() {
        var text = this._Input.text();
        if (text || this.attach.length > 0) {
            this.createMessage(text);
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
        var limitSize = UPLOAD_LIMIT * 1024 * 1024; // bytes
        var formdata = new FormData();
        var files = self._AttachInput.get(0).files;
        if (files.length === 0) return;
        if (files[0].size > limitSize) {
            $.messager.show({
                title: 'Ошибка загрузки файла',
                msg: 'Выбранный файл больше установленного лимита в ' + UPLOAD_LIMIT + ' МБ.',
                showType: 'fade',
                style: {
                    right: '',
                    bottom: ''
                }
            });
            return;
        }
        formdata.append(0, files[0]);
        self._Progress.progressbar('setColor', null);
        self._FileBtn.show();
        self._AttachBtn.linkbutton('disable');
        self._Progress.progressbar({
            value: 0,
            text: _.truncateFilename(files[0].name, 15)
        });
        $.ajax({
            type: 'post',
            url: '/storage',
            data: formdata,
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
            //console.log(respond);
            self.attach.push({
                fileId: respond.fileId,
                filename: respond.originalname,
                uploadname: respond.name
            });
            self._Progress.progressbar('setColor', 'green');
        });
    },
    doDownload: function(e) {
        return _.isHttpStatusOK(e.currentTarget.href);
    }
});
//
// Members view
//
var MembersView = Backbone.View.extend({
    initialize: function(options) {
        // Variables
        var self = this;
        this.options = options || {};
        // Single item view
        this.ItemView = Backbone.View.extend({
            tagName: "li",
            initialize: function() {
                this.template = _.template($('#members-item-tpl').html());
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'destroy', this.remove);
            },
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                return this;
            }
        });
        // jQuery selectors
        this._Panel = this.$(".members-panel");
        this._Output = this.$(".members-output");
        // Member model
        var Member = Backbone.Model.extend({
            idAttribute: "_id"
        });
        // Online collection
        var MembersList = Backbone.Collection.extend({
            url: '/members/' + this.options.examId,
            model: Member
        });
        this.collection = new MembersList();
        this.listenTo(this.collection, 'add', this.appendItem);
        this.collection.fetch();
        // Socket notification
        app.io.notify.on('members-' + this.options.examId, function(data) {
            self.collection.fetch();
        });
    },
    destroy: function() {
        app.io.notify.removeListener('members-' + this.options.examId);
        this.remove();
    },
    appendItem: function(model) {
        var view = new this.ItemView({
            model: model
        });
        this._Output.append(view.render().el);
    }
});
//
// Webcam view
//
var WebcamView = Backbone.View.extend({
    initialize: function(options) {
        this.options = options || {};
        this._VideoInput = this.$(".video-input");
        this._VideoOutput = this.$(".video-output");
        this.videoInput = this._VideoInput.get(0);
        this.videoOutput = this._VideoOutput.get(0);
        this._VideoInput.draggable({
            onDrag: function(e) {
                var d = e.data;
                var parent = $(d.parent);
                var target = $(d.target);
                if (d.left < 0) {
                    d.left = 0;
                }
                if (d.top < 0) {
                    d.top = 0;
                }
                if (d.left + target.outerWidth() > parent.width()) {
                    d.left = parent.width() - target.outerWidth();
                }
                if (d.top + target.outerHeight() > parent.height()) {
                    d.top = parent.height() - target.outerHeight();
                }
            }
        });
        this.webcall = new Webcall({
            socket: app.io.call,
            constraints: this.constraints(),
            input: this.videoInput,
            output: this.videoOutput,
            userid: "webcam-" + this.options.examId + "-" + this.options.userId
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
                    self.play(app.content.model.get('student')._id);
                    $(this).parent().find('.fa-microphone-slash').attr('class', 'fa fa-microphone');
                    $(this).parent().find('.fa-eye-slash').attr('class', 'fa fa-eye');
                }
            }, {
                iconCls: 'fa fa-pause',
                handler: function() {
                    self.stop();
                }
            }, {
                iconCls: 'fa fa-microphone',
                handler: function() {
                    var audio = self.webcall.toggleAudio();
                    if (audio) {
                        $(this).attr('class', 'fa fa-microphone');
                    }
                    else {
                        $(this).attr('class', 'fa fa-microphone-slash');
                    }
                }
            }, {
                iconCls: 'fa fa-eye',
                handler: function() {
                    var video = self.webcall.toggleVideo();
                    if (video) {
                        $(this).attr('class', 'fa fa-eye');
                    }
                    else {
                        $(this).attr('class', 'fa fa-eye-slash');
                    }
                }
            }]
        });
    },
    constraints: function() {
        var audioSource = app.settings.get('webcamera-audio');
        audioSource = audioSource ? audioSource.get('value') : null;
        var videoSource = app.settings.get('webcamera-video');
        videoSource = videoSource ? videoSource.get('value') : null;
        var resolution = app.settings.get('webcamera-resolution');
        resolution = resolution ? resolution.get('value').split('x') : [1280, 720];
        var fps = app.settings.get('webcamera-fps');
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
        return constraints;
    },
    mute: function(state) {
        this.webcall.toggleAudio(!state);
        this.webcall.toggleVideo(!state);
    },
    play: function(userId) {
        var peer = "webcam-" + this.options.examId + "-" + userId;
        this.webcall.set('constraints', this.constraints());
        this.webcall.toggleAudio(true);
        this.webcall.toggleVideo(true);
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
    initialize: function(options) {
        this.options = options || {};
        this._VideoInput = this.$(".video-input");
        this._VideoOutput = this.$(".video-output");
        this.videoInput = this._VideoInput.get(0);
        this.videoOutput = this._VideoOutput.get(0);
        this._VideoInput.draggable({
            onDrag: function(e) {
                var d = e.data;
                var parent = $(d.parent);
                var target = $(d.target);
                if (d.left < 0) {
                    d.left = 0;
                }
                if (d.top < 0) {
                    d.top = 0;
                }
                if (d.left + target.outerWidth() > parent.width()) {
                    d.left = parent.width() - target.outerWidth();
                }
                if (d.top + target.outerHeight() > parent.height()) {
                    d.top = parent.height() - target.outerHeight();
                }
            }
        });
        this.webcall = new Webcall({
            socket: app.io.screen,
            constraints: this.constraints(),
            input: this.videoInput,
            output: this.videoOutput,
            userid: "screen-" + this.options.examId + "-" + app.profile.get('_id')
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
                    self.play(app.content.model.get('student')._id);
                }
            }, {
                iconCls: 'fa fa-pause',
                handler: function() {
                    self.stop();
                }
            }]
        });
    },
    constraints: function() {
        var constraints = {
            audio: false,
            video: true
        };
        if (this.videoInput) {
            var resolution = app.settings.get('screen-resolution');
            resolution = resolution ? resolution.get('value').split('x') : [1280, 720];
            var fps = app.settings.get('screen-fps');
            fps = fps ? fps.get('value') : 15;
            var sourceId = app.settings.get('screen-id');
            sourceId = sourceId ? sourceId.get('value') : 'screen:0';
            constraints.video = {
                mandatory: {
                    maxWidth: resolution[0],
                    maxHeight: resolution[1],
                    maxFrameRate: fps,
                    minFrameRate: 1,
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId
                }
            };
        }
        return constraints;
    },
    play: function(userId) {
        var peer = "screen-" + this.options.examId + "-" + userId;
        this.webcall.set('constraints', this.constraints());
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
    events: {
        "click .start-btn": "doStart",
        "click .plan-btn": "doPlan",
        "click .cancel-btn": "doCancel"
    },
    initialize: function() {
        // Variables
        var self = this;
        this.historyFlag = false;
        // jQuery selectors
        this._Menu = $('#main-menu');
        this._TimeWidget = this.$('.time-widget');
        this._CountdownWidget = this.$('.countdown-widget');
        this._StartBtn = this.$('.start-btn');
        this._PlanBtn = this.$('.plan-btn');
        this._CancelBtn = this.$('.cancel-btn');
        this._Grid = this.$('.exams-table');
        this._Dialog = $('#plan-dlg');
        this._PlanSubject = this._Dialog.find('.plan-subject');
        this._PlanFrom = this._Dialog.find('.plan-from');
        this._PlanTo = this._Dialog.find('.plan-to');
        this._PlanDuration = this._Dialog.find('.plan-duration');
        this._PlanGrid = this._Dialog.find('.plan-table');
        // Model
        var Exam = Backbone.Model.extend({
            idAttribute: '_id',
            urlRoot: '/exam'
        });
        this.model = new Exam();
        // Dialog
        this._Dialog.dialog({
            buttons: [{
                text: 'Обновить',
                iconCls: 'fa fa-refresh',
                handler: function() {
                    self._PlanGrid.datagrid('reload');
                }
            }, {
                text: 'Выбрать',
                iconCls: 'fa fa-check',
                handler: function() {
                    var selectedDate = self._PlanGrid.datagrid('getSelected');
                    if (selectedDate) {
                        self.model.save({
                            beginDate: selectedDate
                        }, {
                            success: function(model) {
                                self.refreshTable();
                                self._Dialog.dialog('close');
                            }
                        });
                    }
                }
            }, {
                text: 'Отменить',
                iconCls: 'fa fa-times',
                handler: function() {
                    self._Dialog.dialog('close');
                }
            }],
            onOpen: function() {
                $(this).dialog('center');
                var subject = self.model.get('subject');
                var duration = self.model.get('duration');
                var leftDate = moment(self.model.get('leftDate')).format('DD.MM.YYYY');
                var rightDate = moment(self.model.get('rightDate')).format('DD.MM.YYYY');
                self._PlanSubject.text(subject);
                self._PlanFrom.text(leftDate);
                self._PlanTo.text(rightDate);
                self._PlanDuration.text(duration);
            }
        });
        // DOM events
        this._Menu.menu({
            onClick: function(item) {
                switch (item.name) {
                    case "refresh":
                        self.refreshTable();
                        break;
                    case "history":
                        self.toggleHistory(item);
                        break;
                    case "demo":
                        self.view.demo.doOpen();
                        break;
                    case "passport":
                        self.view.passport.doOpen();
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
            passport: new PassportEditorView(),
            info: new InfoView(),
            demo: new DemoView()
        };
        // Timers
        this.timer = moment(0);
        // Current time timer
        var t1 = setInterval(function() {
            self._TimeWidget.text(app.now().format('HH:mm:ss'));
        }, 1000);
        // Countdown timer
        var t2 = setInterval(function() {
            if (!self.nextExam) return;
            // decrement
            self.nextExam.countdown -= 1000;
            if (self.nextExam.countdown <= 0 && self.nextExam.resolution == null) {
                if (self.nextExam.countdown > -1000) self._Grid.datagrid('reload');
            }
            // display countdown
            if (self.nextExam.countdown < 0) self.nextExam.countdown = 0;
            var days = moment.duration(self.nextExam.countdown, 'ms').days();
            var times = moment(self.nextExam.countdown).utc().format('HH:mm:ss');
            self._CountdownWidget.text(days + '.' + times);
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
                    field: 'subject',
                    title: 'Экзамен',
                    width: 200,
                    formatter: self.formatSubject
                }, {
                    field: 'beginDate',
                    title: 'Начало',
                    width: 150,
                    formatter: self.formatDate
                }, {
                    field: 'duration',
                    title: 'Длительность',
                    width: 100,
                    formatter: self.formatDuration
                }, {
                    field: 'status',
                    title: 'Статус',
                    width: 100,
                    formatter: self.formatStatus
                }]
            ],
            url: '/student',
            method: 'get',
            onSelect: function(index, row) {
                if (!row) return;
                self.model.set(row);
                var rightDate = moment(row.rightDate);
                var beginDate = moment(row.beginDate);
                var endDate = moment(row.endDate);
                var now = app.now();
                self._PlanBtn.hide();
                self._CancelBtn.hide();
                self._StartBtn.hide();
                if (row.rightDate && rightDate < now) {}
                else if (!row.beginDate || !row.endDate) {
                    self._PlanBtn.show();
                }
                else if (beginDate > moment(now).add(OFFSET, 'hours')) {
                    self._CancelBtn.show();
                }
                else if (beginDate <= now && !row.stopDate &&
                    (endDate > now || row.startDate)) {
                    self._StartBtn.show();
                }
            },
            onLoadSuccess: function(data) {
                var now = app.now();
                self.nextExam = null;
                for (var k in data.rows) {
                    if (!data.rows[k].beginDate || !data.rows[k].endDate) continue;
                    var beginDate = moment(data.rows[k].beginDate);
                    var endDate = moment(data.rows[k].endDate);
                    if (!self.nextExam && endDate > now) {
                        self.nextExam = {
                            beginDate: beginDate,
                            countdown: beginDate.diff(now)
                        };
                    }
                    if (beginDate <= now && endDate > now) {
                        self._Grid.datagrid('selectRow', k);
                        return;
                    }
                }
                self._Grid.datagrid('selectRow', 0);
            }
        });
        this._PlanGrid.datagrid({
            columns: [
                [{
                    field: 'date',
                    title: 'Дата',
                    width: 200,
                    formatter: function(val, row) {
                        return moment(row).format('DD.MM.YYYY');
                    }
                }, {
                    field: 'time',
                    title: 'Время начала',
                    width: 200,
                    formatter: function(val, row) {
                        return moment(row).format('HH:mm');
                    }
                }]
            ],
            method: 'get'
        });
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        for (var v in this.view) {
            if (this.view[v]) this.view[v].destroy();
        }
        this.remove();
    },
    toggleHistory: function(item) {
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
        this.refreshTable();
    },
    refreshTable: function() {
        this._Grid.datagrid({
            queryParams: {
                history: this.historyFlag ? '1' : '0'
            }
        });
    },
    doStart: function() {
        var selected = this._Grid.datagrid('getSelected');
        var disabled = this._StartBtn.linkbutton('options').disabled;
        if (selected && !disabled) {
            app.router.navigate("exam/" + selected._id, {
                trigger: true
            });
        }
    },
    doPlan: function() {
        var selected = this._Grid.datagrid('getSelected');
        var disabled = this._PlanBtn.linkbutton('options').disabled;
        if (selected && !disabled) {
            this._Dialog.dialog('open');
            this._PlanGrid.datagrid({
                url: '/exam?leftDate=' + selected.leftDate + '&rightDate=' +
                    selected.rightDate + '&duration=' + selected.duration
            });
        }
    },
    doCancel: function() {
        var self = this;
        $.messager.confirm('Подтверждение', 'Вы действительно хотите отменить выбранный экзамен?', function(r) {
            if (r) {
                self.model.destroy({
                    success: function(model) {
                        self.refreshTable();
                    }
                });
            }
        });
    },
    formatDuration: function(val, row) {
        if (!val) return;
        return val + ' мин.';
    },
    formatDate: function(val, row) {
        if (!val) return;
        return moment(val).format('DD.MM.YYYY HH:mm');
    },
    formatSubject: function(val, row) {
        if (!val || !row) return;
        var html = $('#subject-item-tpl').html();
        var tpl = _.template(html);
        return tpl({
            examId: row._id,
            subject: val
        });
    },
    formatStatus: function(val, row) {
        var status = 0;
        var d = app.now();
        if (row.rightDate) {
            var rightDate = moment(row.rightDate);
            if (rightDate <= d) status = 6;
        }
        if (row.beginDate && row.endDate) {
            var beginDate = moment(row.beginDate);
            var endDate = moment(row.endDate);
            if (beginDate > d) status = 1;
            if (endDate <= d) status = 6;
            if (beginDate <= d && endDate > d) status = 2;
            if (row.startDate) status = 3;
            if (row.resolution === true) status = 4;
            if (row.resolution === false) status = 5;
        }
        switch (status) {
            case 0:
                return '<span style="color:olive;">Не запланирован</span>';
            case 1:
                return '<span style="color:teal;">Запланирован</span>';
            case 2:
                return '<span style="color:orange;">Ожидает</span>';
            case 3:
                return '<span style="color:red;">Идет</span>';
            case 4:
                return '<span style="color:green;">Сдан</span>';
            case 5:
                return '<span style="color:purple;">Прерван</span>';
            case 6:
                return '<span style="color:gray;">Пропущен</span>';
            default:
                return null;
        }
    },
    doInfo: function(examId) {
        this.view.info.doOpen(examId);
    }
});
//
// Exam view
//
var ExamView = Backbone.View.extend({
    initialize: function(options) {
        // Variables
        var self = this;
        this.options = options || {};
        // jQuery selectors
        this._Menu = $('#main-menu');
        this._Webcam = this.$('.panel-webcam');
        this._Screen = this.$('.panel-screen');
        this._Chat = this.$('.panel-chat');
        this._NetworkWidget = this.$('.network-widget');
        this._TimeWidget = this.$('.time-widget');
        this._Members = this.$('.panel-members');
        this._DurationWidget = this.$('.duration-widget');
        this._StudentWidget = this.$('.student-widget');
        this._ExamWidget = this.$('.exam-widget');
        this._FinishBtn = this.$('.finish-btn');
        // DOM events
        this._Menu.menu({
            onClick: function(item) {
                switch (item.name) {
                    case "info":
                        self.view.info.doOpen(self.options.examId);
                        break;
                    case "passport":
                        self.view.passport.doOpen();
                        break;
                    case "settings":
                        self.view.settings.doOpen();
                        break;
                    case "disconnect":
                        self.disconnect();
                        break;
                }
            }
        });
        // Socket events
        this.connectHandler = function(data) {
            self._NetworkWidget.html('В сети');
            self._NetworkWidget.css('color', 'green');
        };
        this.disconnectHandler = function(data) {
            self._NetworkWidget.html('Не в сети');
            self._NetworkWidget.css('color', 'red');
        };
        app.io.notify.on('connect', this.connectHandler);
        app.io.notify.on('disconnect', this.disconnectHandler);
        // Sub views
        this.view = {
            settings: new SettingsView(),
            passport: new PassportView(),
            info: new InfoView(),
            chat: new ChatView({
                el: this._Chat.get(0),
                examId: this.options.examId
            }),
            members: new MembersView({
                el: this._Members.get(0),
                examId: this.options.examId
            }),
            webcam: new WebcamView({
                el: this._Webcam.get(0),
                examId: this.options.examId,
                userId: app.profile.get('_id')
            }),
            screen: new ScreenView({
                el: this._Screen.get(0),
                examId: this.options.examId,
                userId: app.profile.get('_id')
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
                if (element.className == 'video-input') {
                    element.style.left = '';
                    element.style.bottom = '';
                    element.style.top = '5px';
                    element.style.right = '5px';
                }
            });
        };
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
        var t1 = setInterval(function() {
            var now = app.now();
            self._TimeWidget.text(now.format('HH:mm:ss'));
            var startDate = self.model.get('startDate');
            if (startDate) {
                var diff = now.diff(startDate);
                if (diff < 0) diff = 0;
                var timer = moment(diff);
                self._DurationWidget.text(timer.utc().format('HH:mm:ss'));
            }
            var endDate = self.model.get('endDate');
            if (endDate) {
                if (moment(endDate).diff(now, 'minutes') <= 5)
                    self._DurationWidget.css('color', 'red');
                else if (moment(endDate).diff(now, 'minutes') <= 15)
                    self._DurationWidget.css('color', 'orange');
            }
        }, 1000);
        this.timers = [t1];
        // Student model
        var Student = Backbone.Model.extend({
            idAttribute: '_id',
            urlRoot: '/student'
        });
        this.model = new Student({
            _id: this.options.examId
        });
        this.listenTo(this.model, 'change', this.render);
        // Socket notification
        app.io.notify.on('exam-' + this.options.examId, function(data) {
            if (!app.profile.isMe(data.userId)) {
                self.model.fetch();
            }
        });
        // Start exam
        this.model.fetch();
    },
    render: function() {
        var resolution = this.model.get("resolution");
        if (resolution != null) {
            var comment = this.model.get("comment");
            var message = "";
            if (resolution === true) {
                message += 'Инспектор <strong style="color:green">подписал</strong> экзамен:';
            }
            else {
                message += 'Инспектор <strong style="color:red">прервал</strong> экзамен:';
            }
            if (comment) {
                message += '<p>' + comment + '</p>';
            }
            else {
                message += '<p>Без комментария.</p>';
            }
            $.messager.alert('Экзамен завершен', message, null, function() {
                app.router.navigate("schedule", {
                    trigger: true
                });
            });
            return;
        }
        var subject = this.model.get("subject");
        this._ExamWidget.text(subject);
        this._DurationWidget.css('color', '');
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        for (var v in this.view) {
            if (this.view[v]) this.view[v].destroy();
        }
        app.io.notify.removeListener('exam-' + this.options.examId);
        app.io.notify.removeListener('connect', this.connectHandler);
        app.io.notify.removeListener('disconnect', this.disconnectHandler);
        this.remove();
    },
    disconnect: function() {
        app.router.navigate("schedule", {
            trigger: true
        });
    }
});
//
// Info view
//
var InfoView = Backbone.View.extend({
    tagName: 'div',
    initialize: function(options) {
        var self = this;
        this.options = options || {};
        var dialog = $(this.el).dialog({
            title: 'Карточка экзамена',
            width: 500,
            height: 380,
            closed: true,
            modal: true,
            cache: false,
            href: '/templates/info.html',
            onLoad: function() {
                self.model.clear();
                if (self.options.examId) {
                    self.model.set('_id', self.options.examId);
                    self.model.fetch({
                        success: function() {
                            self.render();
                        }
                    });
                }
            },
            onOpen: function() {
                $(this).dialog('center');
            },
            buttons: [{
                text: 'Закрыть',
                iconCls: 'fa fa-times',
                handler: function() {
                    self.doClose();
                }
            }],
            loadingMessage: 'Загрузка...'
        });
        this._Dialog = $(dialog);
        // Dialog model
        var DialogModel = Backbone.Model.extend({
            idAttribute: '_id',
            urlRoot: '/exam'
        });
        this.model = new DialogModel();
    },
    destroy: function() {
        this.remove();
    },
    render: function() {
        var view = this.$('.info-view');
        var tpl = _.template($("#info-tpl").html());
        var html = tpl({
            exam: this.model.toJSON()
        });
        view.html(html);
    },
    doOpen: function(examId) {
        if (examId) this.options.examId = examId;
        else this.options.userId = null;
        this._Dialog.dialog('open');
    },
    doClose: function() {
        this._Dialog.dialog('close');
    }
});
//
// Passport view
//
var PassportView = Backbone.View.extend({
    events: {
        "click .attach-link": "doDownload"
    },
    tagName: 'div',
    initialize: function(options) {
        var self = this;
        this.options = options || {};
        // Dialog
        var dialog = $(this.el).dialog({
            title: 'Профиль студента',
            width: 500,
            height: 450,
            closed: true,
            modal: true,
            cache: false,
            href: '/templates/passport.html',
            onLoad: function() {
                self.model.clear();
                if (self.options.userId) {
                    self.model.set('_id', self.options.userId);
                }
                else {
                    self.model.set('_id', app.profile.get('_id'));
                }
                self.model.fetch({
                    success: function() {
                        self.render();
                    }
                });
            },
            onOpen: function() {
                $(this).dialog('center');
            },
            buttons: [{
                text: 'Закрыть',
                iconCls: 'fa fa-times',
                handler: function() {
                    self.doClose();
                }
            }],
            loadingMessage: 'Загрузка...'
        });
        this._Dialog = $(dialog);
        // Variables
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
        // Dialog model
        var DialogModel = Backbone.Model.extend({
            idAttribute: '_id',
            urlRoot: '/passport'
        });
        this.model = new DialogModel();
        //this.listenTo(this.model, 'change', this.render);
    },
    destroy: function() {
        this.remove();
    },
    render: function() {
        var view = this.$('.passport-view');
        var tpl = _.template($("#passport-tpl").html());
        var html = tpl({
            user: this.model.toJSON()
        });
        view.html(html);
    },
    doOpen: function(userId) {
        if (userId) this.options.userId = userId;
        else this.options.userId = null;
        this._Dialog.dialog('open');
    },
    doClose: function() {
        this._Dialog.dialog('close');
    },
    doDownload: function(e) {
        return _.isHttpStatusOK(e.currentTarget.href);
    }

});
//
// PassportEditor view
//
var PassportEditorView = Backbone.View.extend({
    tagName: 'div',
    events: {
        "change .passport-attach-input": "onFileChange",
        "click .passport-delete-file": "removeAttach",
        "click .attach-link": "doDownload"
    },
    initialize: function(options) {
        var self = this;
        this.options = options || {};
        // Dialog
        var dialog = $(this.el).dialog({
            title: 'Профиль студента',
            width: 500,
            height: 530,
            closed: true,
            modal: true,
            cache: false,
            href: '/templates/passport-editor.html',
            onLoad: function() {
                self.model.clear();
                if (self.options.userId) {
                    self.model.set('_id', self.options.userId);
                }
                else {
                    self.model.set('_id', app.profile.get('_id'));
                }
                self.model.fetch({
                    success: function() {
                        self.render();
                    }
                });
            },
            onOpen: function() {
                $(this).dialog('center');
            },
            buttons: [{
                text: 'Прикрепить',
                iconCls: 'fa fa-paperclip',
                handler: function() {
                    self.doAttach();
                }
            }, {
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
            }],
            loadingMessage: 'Загрузка...'
        });
        this._Dialog = $(dialog);
        // Dialog model
        var DialogModel = Backbone.Model.extend({
            idAttribute: '_id',
            urlRoot: '/passport'
        });
        this.model = new DialogModel();
        //this.listenTo(this.model, 'change', this.render);
    },
    destroy: function() {
        this.remove();
    },
    render: function() {
        // Variables
        this.attachedFile = false;
        this._AttachInput = this.$(".passport-attach-input");
        this._Progress = this.$(".passport-progress");
        this._AttachList = this.$(".passport-files");
        this._AttachForm = this.$(".passport-attach-form");
        this._EditForm = this.$('.passport-form');
        // Load form data
        this._EditForm.form('load', this.model.toJSON());
        // Display files
        this.drawAttachList();
    },
    removeAttach: function(event) {
        var attachId = $(event.currentTarget).attr("data-id");
        var attach = this.model.get('attach');
        if (attach[attachId].fileId) {
            attach[attachId].removed = 1;
        }
        else {
            attach.splice(attachId, 1);
        }
        //this.model.trigger('change');
        this.drawAttachList();
    },
    drawAttachList: function() {
        this._AttachList.html('');
        var attach = this.model.get('attach');
        for (var i = 0, l = attach.length; i < l; i++) {
            if (attach[i].removed) continue;
            var html = '<div><i class="fa fa-paperclip"></i> ';
            if (attach[i].fileId) {
                html += '<a class="attach-link" href="/storage/' + attach[i].fileId + '" title="' +
                    attach[i].filename + '">' + _.truncateFilename(attach[i].filename, 25) +
                    '</a>';
            }
            else {
                html += '<span title="' + attach[i].filename + '">' +
                    _.truncateFilename(attach[i].filename, 25) + '</span>';
            }
            html += ' <i data-id="' + i +
                '" class="fa fa-times passport-delete-file" title="Удалить" style="cursor:pointer;"></i></div>';
            this._AttachList.append(html);
        }
    },
    doAttach: function() {
        if (this.attachedFile) return;
        this._AttachInput.trigger('click');
    },
    onFileChange: function() {
        var self = this;
        var limitSize = UPLOAD_LIMIT * 1024 * 1024; // 10 MB
        var data = new FormData(this._AttachForm);
        var files = self._AttachInput[0].files;
        if (files.length === 0 || files[0].size > limitSize) {
            return;
        }
        $.each(files, function(key, value) {
            data.append(key, value);
        });
        var filename = files['0'].name;
        self.attachedFile = true;
        self._Progress.show();
        self._Progress.progressbar({
            value: 0,
            text: _.truncateFilename(filename, 15)
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
            var attach = self.model.get('attach');
            attach.push({
                fileId: respond.fileId,
                filename: respond.originalname,
                uploadname: respond.name
            });
            self._Progress.hide();
            self.drawAttachList();
            self.attachedFile = false;
        });
    },
    doSave: function() {
        var self = this;
        var config = {};
        this._EditForm.serializeArray().map(function(item) {
            if (config[item.name]) {
                if (typeof(config[item.name]) === "string") {
                    config[item.name] = [config[item.name]];
                }
                config[item.name].push(item.value);
            }
            else {
                config[item.name] = item.value;
            }
        });
        config.attach = this.model.get('attach');
        this.model.save(config, {
            success: function(model) {
                app.profile.clear().set(model.attributes);
                self.doClose();
            }
        });
    },
    doOpen: function(userId) {
        if (userId) this.options.userId = userId;
        else this.options.userId = null;
        this._Dialog.dialog('open');
    },
    doClose: function() {
        this._Dialog.dialog('close');
    },
    doDownload: function(e) {
        return _.isHttpStatusOK(e.currentTarget.href);
    }
});
//
// Profile view
//
var ProfileView = Backbone.View.extend({
    tagName: 'div',
    initialize: function(options) {
        var self = this;
        this.options = options || {};
        var dialog = $(this.el).dialog({
            title: 'Профиль инспектора',
            width: 500,
            height: 270,
            closed: true,
            modal: true,
            cache: false,
            href: '/templates/profile.html',
            onLoad: function() {
                self.model.clear();
                if (self.options.userId) {
                    self.model.set('_id', self.options.userId);
                    self.model.fetch({
                        success: function() {
                            self.render();
                        }
                    });
                }
                else {
                    self.model.set(app.profile.toJSON());
                    self.render();
                }
            },
            buttons: [{
                text: 'Закрыть',
                iconCls: 'fa fa-times',
                handler: function() {
                    self.doClose();
                }
            }],
            onOpen: function() {
                $(this).dialog('center');
            },
            loadingMessage: 'Загрузка...'
        });
        this._Dialog = $(dialog);
        // Dialog model
        var DialogModel = Backbone.Model.extend({
            idAttribute: '_id',
            urlRoot: '/passport'
        });
        this.model = new DialogModel();
    },
    destroy: function() {
        this.remove();
    },
    render: function() {
        var view = this.$('.profile-view');
        var tpl = _.template($("#profile-tpl").html());
        var html = tpl(this.model.toJSON());
        view.html(html);
    },
    doOpen: function(userId) {
        if (userId) this.options.userId = userId;
        else this.options.userId = null;
        this._Dialog.dialog('open');
    },
    doClose: function() {
        this._Dialog.dialog('close');
    }
});
//
// Settings view
//
var SettingsView = Backbone.View.extend({
    tagName: 'div',
    events: {
        "click .check-update-btn": "doUpdate"
    },
    initialize: function() {
        var self = this;
        var dialog = $(this.el).dialog({
            title: 'Настройки',
            width: 500,
            height: 400,
            closed: true,
            modal: true,
            href: '/templates/settings.html',
            onLoad: function() {
                self.render();
            },
            onOpen: function() {
                $(this).dialog('center');
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
            }],
            loadingMessage: 'Загрузка...'
        });
        this._Dialog = $(dialog);
        // Events
        this.eventHandler = function(event) {
            var message = event.data;
            switch (message.id) {
                case 'sourceId':
                    if (message.data) {
                        self._ScreenId.textbox('setValue', message.data);
                    }
                    break;
                case 'version':
                    self._Version.text(message.data.app + ' [nw.js ' + message.data.nw + ']');
                    self.doUpdate(message.data.app);
                    break;
            }
        };
        window.addEventListener('message', this.eventHandler);
    },
    destroy: function() {
        window.removeEventListener('message', this.eventHandler);
        this.remove();
    },
    render: function() {
        function getMediaSources(kind, callback) {
            MediaStreamTrack.getSources(function(sources) {
                var mediaSources = [];
                var k = 0;
                for (var i = 0, l = sources.length; i < l; i++) {
                    var source = sources[i];
                    if (source.kind == kind) {
                        k++;
                        mediaSources.push({
                            name: source.id,
                            value: source.label || 'Неизвестный источник ' + k
                        });
                    }
                }
                if (callback) callback(mediaSources);
            });
        }
        this._ScreenBtn = this.$('.screen-btn');
        this._WebcameraAudio = this.$('.webcamera-audio');
        this._WebcameraVideo = this.$('.webcamera-video');
        this._SettingsForm = this.$('.settings-form');
        this._ScreenId = this.$('.screen-id');
        this._Version = this.$('.app-version');
        this._Update = this.$('.app-update');
        this._Dist = this.$('.app-dist');
        app.postMessage('getVersion', '*');
        this._ScreenBtn.click(function() {
            app.postMessage('chooseSourceId', '*');
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
    },
    doUpdate: function(version) {
        var self = this;
        $.getJSON("dist/metadata.json", function(data) {
            if (data && data.version != version) {
                self._Update.html(data.version + " (" + moment(data.date).format('YYYY.MM.DD HH:mm:ss') + ")");
                self._Dist.html('');
                for (var k in data.md5) {
                    self._Dist.append('<li><a href="dist/' + k + '">' + k + '</a></li>');
                    self._Dist.append('<li>[MD5: ' + data.md5[k] + ']</li>');
                }
            }
        });
    }
});
//
// Demo view
//
var DemoView = Backbone.View.extend({
    tagName: 'div',
    events: {
        "click .play-btn": "doPlay",
        "click .stop-btn": "doStop",
        "click .networkcheck-btn": "doNetworkCheck"
    },
    initialize: function() {
        var self = this;
        var dialog = $(this.el).dialog({
            title: 'Проверка связи',
            width: 500,
            height: 480,
            closed: true,
            modal: true,
            href: '/templates/demo.html',
            onLoad: function() {
                self.render();
            },
            onOpen: function() {
                $(this).dialog('center');
            },
            onClose: function() {
                self.view.webcam.stop();
                self.view.screen.stop();
            },
            loadingMessage: 'Загрузка...'
        });
        this._Dialog = $(dialog);
        this.buffer = this.generateBuffer();
    },
    destroy: function() {
        for (var v in this.view) {
            if (this.view[v]) this.view[v].destroy();
        }
        this.remove();
    },
    render: function() {
        this._Tabs = this.$('.easyui-tabs');
        this._Webcam = this.$('.panel-webcam');
        this._Screen = this.$('.panel-screen');
        this._Network = this.$('.panel-network');
        this._NetworkTpl = $('#network-tpl');
        // Sub views
        this.view = {
            webcam: new WebcamView({
                el: this._Webcam.get(0),
                examId: 'loopback',
                userId: app.profile.get('_id')
            }),
            screen: new ScreenView({
                el: this._Screen.get(0),
                examId: 'loopback',
                userId: app.profile.get('_id')
            })
        };
    },
    doOpen: function() {
        this._Dialog.dialog('open');
    },
    doClose: function() {
        this._Dialog.dialog('close');
    },
    getCurrentTab: function() {
        var tab = this._Tabs.tabs('getSelected');
        var index = this._Tabs.tabs('getTabIndex', tab);
        return index;
    },
    doPlay: function() {
        switch (this.getCurrentTab()) {
            case 0:
                this.view.webcam.play(app.profile.get('_id'));
                break;
            case 1:
                this.view.screen.play(app.profile.get('_id'));
                break;
        }
    },
    doStop: function() {
        switch (this.getCurrentTab()) {
            case 0:
                this.view.webcam.stop();
                break;
            case 1:
                this.view.screen.stop();
                break;
        }
    },
    generateBuffer: function() {
        // Generate 1 MB buffer
        var buffer = 'x';
        for (var i = 0; i < 20; i++) {
            buffer += buffer;
        }
        return buffer;
    },
    doNetworkCheck: function() {
        var self = this;
        var report = {
            ip: "-",
            country: "-",
            city: "-",
            ping: "-",
            tx: "-",
            rx: "-",
            init: function() {
                self._Network.html('Загрузка...');
                report.doIP();
                report.doPing(function() {
                    report.doRX();
                    report.doTX();
                });
            },
            render: function() {
                var tpl = _.template(self._NetworkTpl.html());
                var html = tpl(report);
                self._Network.html(html);
            },
            doIP: function() {
                $.ajax({
                    url: '/tools/ip'
                }).done(function(data) {
                    report.ip = data.ip;
                    if (data.country) report.country = data.country;
                    if (data.city) report.city = data.city;
                    report.render();
                });
            },
            doPing: function(callback) {
                var timestamp;
                $.ajax({
                    url: '/tools/ping',
                    cache: false,
                    beforeSend: function() {
                        timestamp = Date.now();
                    }
                }).done(function() {
                    var diff = Date.now() - timestamp;
                    report.ping = parseInt(diff, 10);
                    report.render();
                    if (callback) callback();
                });
            },
            doRX: function() {
                var timestamp;
                $.ajax({
                    type: 'post',
                    url: '/tools/rx',
                    beforeSend: function(xhr) {
                        timestamp = Date.now();
                    }
                }).done(function() {
                    var diff = Date.now() - timestamp - report.ping;
                    if (diff > 0) {
                        var mbps = 1000 * 8 / diff;
                        report.rx = mbps.toFixed(2);
                        report.render();
                    }
                });
            },
            doTX: function() {
                var timestamp;
                $.ajax({
                    type: 'post',
                    url: '/tools/tx',
                    data: self.buffer,
                    contentType: false,
                    processData: false,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                        timestamp = Date.now();
                    }
                }).done(function() {
                    var diff = Date.now() - timestamp - report.ping;
                    if (diff > 0) {
                        var mbps = 1000 * 8 / diff;
                        report.tx = mbps.toFixed(2);
                        report.render();
                    }
                });
            }
        };
        report.init();
    }
});
//
// Application view
//
var AppView = Backbone.View.extend({
    initialize: function() {
        app = this;
        this.serverTime = new ServerTime();
        this.profile = new Profile();
        this.settings = new Settings();
        this.router = new Router();
        this.connect();
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
    connect: function(options) {
        var url = window.location.host;
        this.io = {
            notify: io.connect(url + '/notify', options),
            call: io.connect(url + '/call', options),
            screen: io.connect(url + '/screen', options)
        };
    },
    postMessage: function(message, targetOrigin, transfer) {
        var win = window.win;
        if (win) win.window.postMessage(message, targetOrigin, transfer);
    },
    now: function() {
        return this.serverTime.now();
    },
    logout: function() {
        app.postMessage('clearCookies', '*');
        if (this.profile.logout()) {
            this.router.navigate("login", {
                trigger: true
            });
        }
    }
});
//
// Functions
//
_.mixin({
    truncateFilename: function(filename, length) {
        var extension = filename.indexOf('.') > -1 ? filename.split('.').pop() : '';
        if (filename.length > length) {
            filename = filename.substring(0, length - extension.length) + '...' + extension;
        }
        return filename;
    },
    isHttpStatusOK: function(url) {
        var status;
        $.ajax({
            url: url,
            type: 'HEAD',
            async: false,
            error: function() {
                status = false;
            },
            success: function() {
                status = true;
            }
        });
        return status;
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