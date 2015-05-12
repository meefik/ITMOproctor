//
// Global initialize
//
var app;
//
// Profile model
//
var Profile = Backbone.Model.extend({
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
            app.profile = self;
            result = true;
        }).fail(function() {
            console.log('profile.update: error');
        });
        return result;
    },
    login: function() {
        var self = this;
        var result = false;
        $.ajax({
            method: "POST",
            url: "/profile/login",
            data: self.toJSON(),
            async: false
        }).done(function(user) {
            console.log('profile.login: success');
            self.clear().set(user);
            app.profile = self;
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
            delete app.profile;
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
// Application routing
//
var Workspace = Backbone.Router.extend({
    routes: {
        "": "main",
        "login": "login",
        "monitor": "monitor",
        "vision/:examid": "vision",
        "play/:examid": "play"
    },
    main: function() {
        if(app.profile.isAuth()) {
            this.navigate("monitor", {
                trigger: true
            });
        } else {
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
        if(this.redirect()) return;
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
        if(this.redirect()) return;
        this.destroy();
        app.render("/templates/vision.tpl", function() {
            var view = new VisionView({
                el: $("#vision"),
                id: examid
            });
            app.content = view;
        });
    },
    play: function(examid) {
        console.log("route: #play");
        if(this.redirect()) return;
        this.destroy();
    },
    redirect: function() {
        if(!app.profile.isAuth()) {
            this.navigate("login", {
                trigger: true
            });
            return true;
        } else {
            return false;
        }
    },
    destroy: function() {
        if(app.content) {
            app.content.destroy();
            app.content.remove();
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
        // ...
    },
    render: function() {
        this.focus();
    },
    submit: function() {
        var username = this._Username.textbox('getValue');
        var password = this._Password.textbox('getValue');
        var user = new Profile({
            username: username,
            password: password
        });
        if(user.login()) {
            app.workspace.navigate("monitor", {
                trigger: true
            });
        } else {
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
        "click .app-logout": "doLogout"
    },
    initialize: function() {
        // Monitor model
        this.Monitor = Backbone.Model.extend({
            urlRoot: '/monitor'
        });
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
        this._ActionItemTpl = $("#action-item-tpl");
        this.render();
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
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
            method: 'get'
        });
        this._DateSearch.datebox({
            onSelect: function(date) {
                self.doSearch();
            }
        });
        this._DateSearch.datebox('options').keyHandler.query = function(q) {
            if(q === '') {
                self.doSearch();
            }
        }
        this._TextSearch.searchbox({
            searcher: function(value, name) {
                self.doSearch();
            }
        });
        var role = {
            "0": "Гость",
            "1": "Студент",
            "2": "Инспектор",
            "3": "Преподаватель"
        };
        this._LoguserWidget.text(app.profile.get("lastname") + " " + app.profile.get("firstname") + " " + app.profile.get("middlename") + " (" + role[app.profile.get("role")] + ")");
        var t1 = setInterval(function() {
            self._TimeWidget.text(moment().format('HH:mm:ss'));
        }, 1000);
        this.timers = [t1];
    },
    formatStatus: function(val, row) {
        var status = 0;
        var d = new Date();
        var beginDate = new Date(row.beginDate);
        var endDate = new Date(row.endDate);
        if(beginDate > d) status = 1;
        if(beginDate <= d && endDate >= d) status = 2;
        if(row.resolution === true) status = 3;
        if(row.resolution === false) status = 4;
        if(row.resolution == null && endDate < d) status = 5;
        switch(status) {
            case 1:
                return '<span style="color:orange;">Ожидает</span>';
            case 2:
                return '<span style="color:red;">Идет</span>';
            case 3:
                return '<span style="color:green;">Сдан</span>';
            case 4:
                return '<span style="color:gray;">Прерван</span>';
            case 5:
                return '<span style="color:blue;">Пропущен</span>';
            default:
                return null;
        }
    },
    formatAction: function(val, row) {
        var html = '<div class="action-item" style="clear:both">\
            <a href="javascript:void(0);" style="padding-left:10px;float:left" onclick="app.content.doInfo(\'<%- rowId %>\');" title="Информация"><i class="fa fa-info-circle fa-lg"></i></a>\
            <% if(openEnabled) { %>\
            <a href="javascript:void(0);" style="padding-right:10px;float:right" onclick="app.content.doPlay(\'<%- rowId %>\');" title="Открыть"><i class="fa fa-play-circle fa-lg"></i></a>\
            <% } %></div>';
        var tpl = _.template(html);
        var d = new Date();
        var startDate = row.startDate;
        var endDate = new Date(row.endDate);
        return tpl({
            rowId: row._id,
            openEnabled: (endDate > d || (row.resolution == null && startDate != null))
        });
    },
    formatDuration: function(val, row) {
        if(row.startDate == null) return null;
        var startDate = moment(row.startDate);
        var stopDate = moment();
        if(row.stopDate != null) stopDate = moment(row.stopDate);
        var duration = stopDate - startDate;
        return moment(duration).utc().format('HH:mm:ss');
    },
    formatDate: function(val, row) {
        if(val == null) return null;
        else {
            var d = new Date(val);
            return moment(d).format('DD.MM.YYYY HH:mm:ss');
        }
    },
    formatSubject: function(val, row) {
        if(val == null) return null;
        return val.title + " (" + val.code + ")";
    },
    formatStudent: function(val, row) {
        if(val == null) return null;
        var user = val;
        return user.lastname + " " + user.firstname + " " + user.middlename;
    },
    formatCurator: function(val, row) {
        if(val == null || val.length === 0) return null;
        var user = val[0];
        return user.lastname + " " + user.firstname + " " + user.middlename;
    },
    doSearch: function() {
        var status = 0;
        switch(true) {
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
        var date = this._DateSearch.datebox('getValue');
        var text = this._TextSearch.textbox('getValue');
        this._Grid.datagrid('load', {
            status: status,
            date: date,
            text: text
        });
    },
    doReload: function() {
        this._Grid.datagrid('reload');
    },
    doInfo: function(rowid) {
        console.log("info " + rowid);
        var self = this;
        var tpl = _.template(this._ExamInfoTpl.html());
        var monitor = new this.Monitor({
            id: rowid
        });
        monitor.fetch({
            success: function(model, response, options) {
                var html = tpl(model.toJSON());
                self._DialogInfo.html(html);
                self._DialogInfo.dialog('open');
            }
        });
    },
    doPlay: function(rowid) {
        app.workspace.navigate("vision/" + rowid, {
            trigger: true
        });
    },
    doLogout: function() {
        app.logout();
    }
});
//
// Vision view
//
var VisionView = Backbone.View.extend({
    events: {
        "click .student-info-btn": "showStudentInfo",
        "click .exam-info-btn": "showSubjectInfo",
        "click .exam-stop-btn": "stopExam",
        "click .exam-apply-btn": "applyExam"
    },
    initialize: function() {
        // Vision model
        var Vision = Backbone.Model.extend({
            urlRoot: '/vision'
        });
        this._NetworkWidget = this.$('.network-widget');
        this._TimeWidget = this.$('.time-widget');
        this._DurationWidget = this.$('.duration-widget');
        this._StudentWidget = this.$('.student-widget');
        this._ExamWidget = this.$('.exam-widget');
        this._DialogStudent = $('#student-info-dlg');
        this._DialogSubject = $('#subject-info-dlg');
        this._StudentInfoTpl = $("#student-info-tpl");
        this._SubjectInfoTpl = $("#subject-info-tpl");
        this.timer = moment(0);
        this.vision = new Vision({
            id: this.id
        });
        this.render();
    },
    render: function() {
        var self = this;
        this.vision.fetch({
            success: function(model, response, options) {
                var student = model.get("student");
                var subject = model.get("subject");
                var startDate = model.get("beginDate");
                var duration = moment() - moment(startDate);
                if(duration > 0) self.timer = moment(duration);
                self._StudentWidget.text(student.lastname + " " + student.firstname + " " + student.middlename);
                self._ExamWidget.text(subject.title + " (" + subject.code + ")");
                // Sub views
                self.notes = new NotesView({
                    el: $("#panel-notes"),
                    id: 'notes-' + self.id
                });
                self.chat = new ChatView({
                    el: $("#panel-chat"),
                    id: 'chat-' + self.id
                });
                self.protocol = new ProtocolView({
                    el: $("#panel-protocol"),
                    id: 'protocol-' + self.id
                });
            }
        });
        var maximizeWidget = function(container, pobj) {
            var p = pobj.panel('panel');
            p.appendTo(container).css({
                position: 'absolute',
                width: container.width(),
                height: container.height()
            });
            pobj.panel('resize');
        }
        var restoreWidget = function(container, pobj) {
            var p = pobj.panel('panel');
            p.appendTo(container).css({
                position: '',
                width: container.width(),
                height: container.height()
            });
            pobj.panel('resize');
        }
        self.$(".ws-widget").each(function(index) {
            var ws = self.$(".ws-content");
            var container = $(this);
            var widget = container.find(".easyui-panel");
            widget.panel({
                onMaximize: function() {
                    maximizeWidget(ws, widget);
                },
                onRestore: function() {
                    restoreWidget(container, widget);
                }
            });
        });
        this._StudentWidget.text();
        this._ExamWidget.text();
        var t1 = setInterval(function() {
            self.timer.add(1, 'seconds');
            self._DurationWidget.text(self.timer.utc().format('HH:mm:ss'));
        }, 1000);
        var t2 = setInterval(function() {
            self._TimeWidget.text(moment().format('HH:mm:ss'));
        }, 1000);
        this.timers = [t1, t2];
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        this.notes.remove();
        this.protocol.remove();
        this.chat.remove();
    },
    showStudentInfo: function() {
        var tpl = _.template(this._StudentInfoTpl.html());
        var vision = this.vision.toJSON();
        var html = tpl(vision);
        this._DialogStudent.html(html);
        this._DialogStudent.dialog('open');
    },
    showSubjectInfo: function() {
        var tpl = _.template(this._SubjectInfoTpl.html());
        var vision = this.vision.toJSON();
        var html = tpl(vision);
        this._DialogSubject.html(html);
        this._DialogSubject.dialog('open');
    },
    stopExam: function() {
        var self = this;
        $.messager.confirm('Прервать', 'Прервать текущий экзамен?', function(r) {
            if(r) {
                self.vision.save({
                    _id: self.id,
                    resolution: false
                }, {
                    success: function() {
                        app.workspace.navigate("monitor", {
                            trigger: true
                        });
                    }
                });
            }
        });
    },
    applyExam: function() {
        var self = this;
        $.messager.confirm('Подписать', 'Подписать текущий экзамен?', function(r) {
            if(r) {
                self.vision.save({
                    _id: self.id,
                    resolution: true
                }, {
                    success: function() {
                        app.workspace.navigate("monitor", {
                            trigger: true
                        });
                    }
                });
            }
        });
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
            idAttribute: "_id",
            toJSON: function() {
                return {
                    time: moment(this.get('time')).format('HH:mm:ss'),
                    text: this.get('text')
                };
            }
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
                    if(r) {
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
            if(e.keyCode == 13) self.add();
        });
        this.collection = new NotesList();
        this.listenTo(this.collection, 'add', this.appendItem);
        this.listenTo(this.collection, 'remove', this.removeItem);
        this.collection.fetch();
        app.socket.on(this.id, function(data) {
            if(!app.profile.isMe(data.userId)) {
                self.collection.fetch();
            }
        });
    },
    add: function() {
        var noteText = this._Input.textbox('getValue');
        if(!noteText) return;
        this.collection.create({
            text: noteText
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
    removeItem: function(model) {
        model.destroy();
    }
});
//
// Chat view
//
var ChatView = Backbone.View.extend({
    events: {
        "click .chat-send-btn": "doSend",
        "click .chat-attach-btn": "doAttach",
        "click .chat-file": "doReset",
        "keyup .chat-input": "doInputKeyup",
        "change .chat-attach": "doFileChange"
    },
    initialize: function() {
        // Chat model
        var Chat = Backbone.Model.extend({
            idAttribute: "_id",
            toJSON: function() {
                var time = moment(this.get('time')).format('HH:mm:ss');
                var author = this.get('author');
                var text = this.get('text');
                var me = app.profile.isMe(author._id);
                author = author.lastname + " " + author.firstname.charAt(0) + "." + author.middlename.charAt(0) + ".";
                return {
                    color: me ? 'red' : 'blue',
                    time: time,
                    author: author,
                    text: text
                };
            }
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
        this._File = this.$(".chat-file");
        this._Attach = this.$(".chat-attach");
        this._Progress = this.$(".chat-progress");
        $.extend($.fn.progressbar.methods, {
            setColor: function(jq, color) {
                var pb = jq.find('.progressbar-value > .progressbar-text');
                var defaultColor = $.data(jq[0], 'progressbar').options.color;
                if(!defaultColor) {
                    defaultColor = pb.css('backgroundColor');
                    $.data(jq[0], 'progressbar').options.color = defaultColor;
                }
                if(color) {
                    pb.css({
                        backgroundColor: color
                    });
                } else {
                    pb.css({
                        backgroundColor: defaultColor
                    });
                }
            }
        });
        this.collection = new ChatList();
        this.listenTo(this.collection, 'add', this.appendItem);
        this.collection.fetch();
        var self = this;
        app.socket.on(this.id, function(data) {
            if(!app.profile.isMe(data.userId)) {
                self.collection.fetch();
            }
        });
    },
    postMessage: function() {
        var text = this._Input.text();
        this._Input.html('');
        if(!text) return;
        var author = {
            _id: app.profile.get('_id'),
            lastname: app.profile.get('lastname'),
            firstname: app.profile.get('firstname'),
            middlename: app.profile.get('middlename')
        };
        this.collection.create({
            author: author,
            text: text
        });
    },
    attachFile: function() {
        var files = this.files;
        if(!files) return;
        var author = {
            _id: app.profile.get('_id'),
            lastname: app.profile.get('lastname'),
            firstname: app.profile.get('firstname'),
            middlename: app.profile.get('middlename')
        };
        var text = 'Файл: <a href="' + files[0].path + '" target="_blank">' + files[0].originalname + '</a>';
        this.collection.create({
            author: author,
            text: text
        });
        this.doReset();
    },
    appendItem: function(model) {
        var view = new this.ItemView({
            model: model
        });
        this._Output.append(view.render().el);
        this._Panel.scrollTop(this._Panel[0].scrollHeight);
    },
    doSend: function() {
        this.postMessage();
        this.attachFile();
    },
    doInputKeyup: function(e) {
        if(e.keyCode == 13) {
            this.doSend();
        }
    },
    doAttach: function() {
        this._Attach.trigger('click');
    },
    doReset: function() {
        this.files = null;
        this._File.hide();
        this._Form.trigger('reset');
    },
    doFileChange: function() {
        var self = this;
        var limitSize = 10 * 1024 * 1024; // 10 MB
        var data = new FormData();
        var files = self._Attach[0].files;
        if(files.length === 0 || files[0].size > limitSize) {
            self.doReset();
            return;
        }
        $.each(files, function(key, value) {
            data.append(key, value);
        });
        var filename = files['0'].name;
        self._Progress.progressbar('setColor', null);
        self._File.show();
        var trancateFile = function(filename, length) {
            var extension = filename.indexOf('.') > -1 ? filename.split('.').pop() : '';
            if(filename.length > length) {
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
            url: '/upload',
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
        }).done(function(data) {
            self.files = data;
            console.log(data);
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
            idAttribute: "_id",
            toJSON: function() {
                return {
                    time: moment(this.get('time')).format('HH:mm:ss'),
                    text: this.get('text')
                };
            }
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
        app.socket.on(this.id, function(data) {
            if(!app.profile.isMe(data.userId)) {
                self.collection.fetch();
            }
        });
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
// Application view
//
var AppView = Backbone.View.extend({
    initialize: function() {
        app = this;
        var url = window.location.host + '/notify';
        this.socket = io.connect(url);
        this.workspace = new Workspace();
        this.profile = new Profile();
        this.profile.update();
        Backbone.history.start();
    },
    render: function(url, callback) {
        this.$el.panel({
            href: url,
            onLoad: function() {
                if(callback) callback();
            }
        });
    },
    logout: function() {
        var workspace = this.workspace;
        if(this.profile.logout()) {
            workspace.navigate("login", {
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
        el: $("#content")
    });
});