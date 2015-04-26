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
    }
});
//
// Note model
//
var Note = Backbone.Model.extend({
    rootUrl: '/api/notes'
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
        app.render("/login", function() {
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
        app.render("/pages/monitor", function() {
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
        app.render("/pages/workspace", function() {
            var view = new VisionView({
                el: $("#vision")
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
        this._Grid = this.$(".easyui-datagrid");
        this._DateSearch = this.$(".date-search");
        this._TextSearch = this.$(".text-search");
        this._StatusBtn1 = this.$(".status-btn1");
        this._StatusBtn2 = this.$(".status-btn2");
        this._StatusBtn3 = this.$(".status-btn2");
        this._TimeWidget = this.$(".time-widget");
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
                    field: 'id',
                    title: 'ID',
                    width: 60
                }, {
                    field: 'student',
                    title: 'Студент',
                    width: 150
                }, {
                    field: 'exam',
                    title: 'Экзамен',
                    width: 200
                }, {
                    field: 'date',
                    title: 'Дата',
                    width: 150,
                    formatter: self.formatDate
                }, {
                    field: 'duration',
                    title: 'Длительность',
                    width: 100,
                    formatter: self.formatDuration
                }, {
                    field: 'inspector',
                    title: 'Инспектор',
                    width: 150
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
            ]
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
        var t1 = setInterval(function() {
            self._TimeWidget.text(moment().format('HH:mm:ss'));
        }, 1000);
        this.timers = [t1];
    },
    formatStatus: function(val, row) {
        switch(val) {
            case 1:
                return '<span style="color:red;">Идет</span>';
            case 2:
                return '<span style="color:orange;">Ожидает</span>';
            case 3:
                return '<span style="color:green;">Сдан</span>';
            case 4:
                return '<span style="color:gray;">Прерван</span>';
            default:
                return null;
        }
    },
    formatAction: function(val, row) {
        var out = '<a href="javascript:void(0);" style="padding:0 8px 0 8px;" onclick="app.content.doInfo(\'' + row.id + '\');" title="Информация"><i class="fa fa-info-circle fa-lg"></i></a>';
        out += '<a href="javascript:void(0);" style="padding:0 8px 0 8px;" onclick="app.content.doPlay(\'' + row.id + '\');" title="Открыть"><i class="fa fa-play-circle fa-lg"></i></a>';
        return out;
    },
    formatDuration: function(val, row) {
        if(val == null) return null;
        else {
            var d = new Date(val);
            return moment(d).utc().format('HH:mm:ss');
        }
    },
    formatDate: function(val, row) {
        if(val == null) return null;
        else {
            var d = new Date(val);
            return moment(d).format('DD.MM.YYYY HH:mm:ss');
        }
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
        "click .exam-info-btn": "showExamInfo",
        "click .exam-stop-btn": "stopExam",
        "click .exam-apply-btn": "applyExam"
    },
    initialize: function() {
        this._DialogStudent = $('#student-info-dlg');
        this._DialogExam = $('#exam-info-dlg');
        this._TimeWidget = $('.time-widget');
        this._DurationWidget = $('.duration-widget');
        this.notes = new NotesView({
            el: $("#panel-notes")
        });
        this.chat = new ChatView({
            el: $("#panel-chat")
        });
        this.render();
    },
    render: function() {
        var self = this;
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
        var timer = 0;
        var t1 = setInterval(function() {
            timer++;
            var d = new Date(timer * 1000);
            self._DurationWidget.text(moment(d).utc().format('HH:mm:ss'));
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
        this.chat.remove();
    },
    showStudentInfo: function() {
        this._DialogStudent.dialog('open');
    },
    showExamInfo: function() {
        this._DialogExam.dialog('open');
    },
    stopExam: function() {
        $.messager.confirm('Прервать', 'Прервать текущий экзамен?', function(r) {
            if(r) {
                console.log('exam stop');
                app.workspace.navigate("monitor", {
                    trigger: true
                });
            }
        });
    },
    applyExam: function() {
        $.messager.confirm('Подписать', 'Подписать текущий экзамен?', function(r) {
            if(r) {
                console.log('exam apply');
                app.workspace.navigate("monitor", {
                    trigger: true
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
        "click .note-add-btn": "add",
        "click .note-edit-btn": "edit",
        "click .note-delete-btn": "delete"
    },
    initialize: function() {
        this._Dialog = $("#note-dlg");
        this._Grid = this.$(".easyui-datagrid");
        this._DialogForm = this._Dialog.find("form");
        this._DialogTime = this._Dialog.find(".note-time");
        this._DialogText = this._Dialog.find(".note-text");
        this.render();
    },
    render: function() {
        var self = this;
        self._Grid.datagrid({
            columns: [
                [{
                    field: 'noteTime',
                    title: 'Время',
                    width: '30%',
                    formatter: self.formatTime
                }, {
                    field: 'noteText',
                    title: 'Текст заметки',
                    width: '70%'
                }]
            ],
            url: '/api/notes',
            method: 'get'
        });
    },
    destroy: function() {
        // ...
    },
    add: function() {
        var self = this;
        var addNote = function() {
            var noteText = self._DialogText.textbox('getValue');
            $.ajax({
                method: "POST",
                url: "/api/notes",
                data: {
                    noteText: noteText
                }
            }).done(function(data) {
                self._Grid.datagrid('appendRow', {
                    noteId: data.noteId,
                    noteTime: data.noteTime,
                    noteText: noteText
                });
                self.close();
                var rows = self._Grid.datagrid('getRows').length;
                self._Grid.datagrid('scrollTo', rows - 1);
            });
        }
        var closeDlg = function() {
            self.close();
        }
        self._Dialog.dialog({
            title: 'Добавление заметки',
            buttons: [{
                text: 'Сохранить',
                iconCls: 'fa fa-check',
                handler: addNote
            }, {
                text: 'Отменить',
                iconCls: 'fa fa-times',
                handler: closeDlg
            }],
            onOpen: function() {
                moment.locale('ru');
                var timeStr = moment().format('LLL');
                self._DialogTime.text(timeStr);
            }
        });
        self._Dialog.dialog('open');
    },
    edit: function() {
        var self = this;
        var row = self._Grid.datagrid('getSelected');
        var idx = self._Grid.datagrid('getRowIndex', row);
        if(idx > -1) {
            var updateNote = function() {
                var noteText = self._DialogText.textbox('getValue');
                $.ajax({
                    method: "PUT",
                    url: "/api/notes/" + row.noteId,
                    data: {
                        noteText: noteText
                    }
                }).done(function(data) {
                    self._Grid.datagrid('updateRow', {
                        index: idx,
                        row: {
                            noteText: noteText
                        }
                    });
                    self.close();
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
                    var timeStr = moment(row.noteTime).format('LLL');
                    self._DialogTime.text(timeStr);
                }
            });
            self._DialogForm.form('load', row);
            self._Dialog.dialog('open');
        }
    },
    delete: function() {
        var self = this;
        var row = self._Grid.datagrid('getSelected');
        var idx = self._Grid.datagrid('getRowIndex', row);
        if(idx > -1) {
            $.messager.confirm('Подтверждение', 'Вы действительно хотите удалить выбранную заметку?', function(r) {
                if(r) {
                    self._Grid.datagrid('deleteRow', idx);
                }
            });
        }
    },
    close: function() {
        this._DialogForm.form('reset');
        this._Dialog.dialog('close');
    },
    formatTime: function(val, row) {
        var noteTime = moment(val).format('HH:mm:ss');
        return noteTime;
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
        this._Input = this.$(".chat-input");
        this._Output = this.$(".chat-output");
        this._File = this.$(".chat-file");
        this._Attach = this.$(".chat-attach");
        this._Progress = this.$(".chat-progress");
        this._Form = this.$("form");
        this.render();
    },
    render: function() {
        // ...
    },
    destroy: function() {
        // ...
    },
    doAttach: function() {
        this._Attach.trigger('click');
    },
    doReset: function() {
        this.filename = null;
        this._File.fadeOut();
        this._Form.trigger('reset');
    },
    doSend: function() {
        var str = this._Input.text();
        if(str.length > 0) {
            var text = '<div><span style="color:red">[' + moment().format('HH:mm:ss') + '] Я:</span> ' + str + '</div>';
        }
        if(this.filename) {
            var link = '<div><span style="color:blue">Файл:</span> <a href="#">' + this.filename + '</a></div>';
            this.doReset();
        }
        this._Output.append(text);
        this._Output.append(link);
        this._Input.html('');
        var height = this._Output[0].scrollHeight;
        this._Output.scrollTop(height);
    },
    doInputKeyup: function(e) {
        if(e.keyCode == 13) {
            this.doSend();
        }
    },
    doFileChange: function() {
        var self = this;
        var data = new FormData();
        var files = self._Attach[0].files;
        if(files.length == 0) {
            self.doReset();
            return;
        }
        $.each(files, function(key, value) {
            data.append(key, value);
        });
        self.filename = files['0'].name;
        self._File.fadeIn();
        var trancateFile = function(filename, length) {
            var extension = filename.indexOf('.') > -1 ? filename.split('.').pop() : '';
            if(filename.length > length) {
                filename = filename.substring(0, length) + '...' + extension;
            }
            return filename;
        }
        self._Progress.progressbar({
            value: 0,
            text: trancateFile(self.filename, 15)
        });
        $.ajax({
            type: 'post',
            url: '/api/upload',
            data: data,
            xhrFields: {
                onprogress: function(progress) {
                    var percentage = Math.floor((progress.loaded / progress.total) * 100);
                    self._Progress.progressbar('setValue', percentage);
                }
            },
            processData: false,
            contentType: false
        }).done(function(data) {
            console.log(data);
        });
    }
});
//
// Application view
//
var AppView = Backbone.View.extend({
    initialize: function() {
        app = this;
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