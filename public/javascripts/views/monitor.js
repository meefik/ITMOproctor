//
// Inspector view
//
define([
    "i18n",
    "text!templates/monitor.html",
    "views/exam",
    "views/profile",
    "views/profile-editor",
    "views/passport",
    "views/schedule",
    "views/settings",
    "views/demo"
], function(i18n, template, ExamView, ProfileView, ProfileEditorView, PassportView, ScheduleView, SettingsView, DemoView) {
    console.log('views/monitor.js');
    var View = Backbone.View.extend({
        events: {
            "click .status-btn1": "doSearch",
            "click .status-btn2": "doSearch",
            "click .status-btn3": "doSearch",
            "click .student-btn": "doStudentInfo",
            "click .inspector-btn": "doInspectorInfo",
            "click .exam-btn": "doExamInfo",
            "click .start-btn": "doStart"
        },
        bindings: {
            '.server-date': {
                observe: 'time',
                onGet: function(val) {
                    return moment(val).format('DD.MM.YYYY');
                }
            },
            '.server-time': {
                observe: 'time',
                onGet: function(val) {
                    return moment(val).format('HH:mm:ss');
                }
            }
        },
        initialize: function() {
            // Variables
            var self = this;
            // Templates
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
                exam: new ExamView(),
                profile: new ProfileView(),
                profileEditor: new ProfileEditorView(),
                passport: new PassportView(),
                schedule: new ScheduleView(),
                settings: new SettingsView(),
                demo: new DemoView()
            };
            // Timers
            var t1 = setInterval(function() {
                var rows = self.$Grid.datagrid('getRows');
                if (rows) {
                    if (!this.nextRow || this.nextRow >= rows.length) this.nextRow = 0;
                    var row = rows[this.nextRow];
                    if (row) {
                        var updatedRow = self.lastUpdated[row._id];
                        if (updatedRow) {
                            self.$Grid.datagrid('updateRow', {
                                index: this.nextRow,
                                row: updatedRow
                            });
                            self.$Grid.datagrid('highlightRow', this.nextRow);
                            delete self.lastUpdated[row._id];
                        }
                        else {
                            self.$Grid.datagrid('refreshRow', this.nextRow);
                        }
                    }
                    this.nextRow++;
                }
            }, 1000);
            this.timers = [t1];
            // Exam model
            var Exam = Backbone.Model.extend({
                urlRoot: 'inspector/exam'
            });
            this.exam = new Exam();
            // Socket events
            this.lastUpdated = {};
            app.io.notify.on('exam', function(data) {
                if (!data) return;
                self.lastUpdated[data._id] = data;
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
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
            // jQuery selectors
            this.$Menu = $('#main-menu');
            this.$Grid = this.$(".easyui-datagrid");
            this.$FromDate = this.$(".date-from");
            this.$ToDate = this.$(".date-to");
            this.$TextSearch = this.$(".text-search");
            this.$StatusBtn1 = this.$(".status-btn1");
            this.$StatusBtn2 = this.$(".status-btn2");
            // Event handlers
            this.$Menu.menu({
                onClick: function(item) {
                    switch (item.name) {
                        case "schedule":
                            self.view.schedule.doOpen();
                            break;
                        case "profile":
                            self.view.profileEditor.doOpen();
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
            this.$FromDate.datebox({
                value: app.now().format("DD.MM.YYYY"),
                delay: 0,
                onChange: function(date) {
                    var valid = moment(date, "DD.MM.YYYY", true).isValid();
                    if (!date || valid) self.doSearch();
                }
            });
            this.$ToDate.datebox({
                value: app.now().format("DD.MM.YYYY"),
                delay: 0,
                onChange: function(date) {
                    var valid = moment(date, "DD.MM.YYYY", true).isValid();
                    if (!date || valid) self.doSearch();
                }
            });
            this.$TextSearch.searchbox({
                searcher: function(value, name) {
                    self.doSearch();
                }
            });
            var dates = this.getDates();
            this.$Grid.datagrid({
                columns: [
                    [{
                        field: 'student',
                        title: i18n.t('monitor.student'),
                        width: 150,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: function(value, row, index) {
                            return self.formatStudent(value, row, index);
                        }
                    }, {
                        field: 'inspector',
                        title: i18n.t('monitor.inspector'),
                        width: 150,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: function(value, row, index) {
                            return self.formatInspector(value, row, index);
                        }
                    }, {
                        field: 'subject',
                        title: i18n.t('monitor.subject'),
                        width: 200,
                        sortable: true,
                        formatter: function(value, row, index) {
                            return self.formatSubject(value, row, index);
                        }
                    }, {
                        field: 'beginDate',
                        title: i18n.t('monitor.beginDate'),
                        width: 150,
                        sortable: true,
                        formatter: function(value, row, index) {
                            return self.formatDate(value, row, index);
                        }
                    }, {
                        field: 'duration',
                        title: i18n.t('monitor.duration'),
                        width: 100,
                        sortable: true,
                        formatter: function(value, row, index) {
                            return self.formatDuration(value, row, index);
                        }
                    }, {
                        field: 'status',
                        title: i18n.t('monitor.status'),
                        width: 100,
                        sortable: true,
                        formatter: function(value, row, index) {
                            return self.formatStatus(value, row, index);
                        }
                    }, {
                        field: 'action',
                        title: '&nbsp;&nbsp;&nbsp;&nbsp;',
                        align: 'center',
                        formatter: function(value, row, index) {
                            return self.formatAction(value, row, index);
                        }
                    }]
                ],
                remoteSort: false,
                pageNumber: 1,
                pageSize: 50,
                pageList: [10, 50, 100, 250, 500],
                rownumbers: true,
                url: 'inspector/exam',
                method: 'get',
                queryParams: {
                    myself: true,
                    from: dates.from,
                    to: dates.to
                },
                onLoadSuccess: function() {
                    self.lastUpdated = {};
                },
                loadFilter: function(data) {
                    var text = self.$TextSearch.textbox('getValue').trim();
                    if (!text.length) return data;
                    var objectToString = function(obj) {
                        var result = "";
                        if (obj instanceof Array) {
                            for (var i = 0; i < obj.length; i++) {
                                result += objectToString(obj[i]);
                            }
                        }
                        else {
                            for (var prop in obj) {
                                if (obj[prop] instanceof Object || obj[prop] instanceof Array) {
                                    result += objectToString(obj[prop]);
                                }
                                if (typeof obj[prop] === 'string') result += obj[prop] + " ";
                            }
                        }
                        return result;
                    };
                    var phrases = text.toLowerCase().split(' ');
                    var rows = data.rows || [];
                    var out = {
                        rows: [],
                        total: 0
                    };
                    for (var i = 0, li = rows.length; i < li; i++) {
                        var str = objectToString(rows[i]).toLowerCase();
                        var cond = true;
                        for (var j = 0, lj = phrases.length; j < lj; j++) {
                            if (str.search(phrases[j]) === -1) {
                                cond = false;
                                break;
                            }
                        }
                        if (cond) out.rows.push(rows[i]);
                    }
                    out.total = out.rows.length;
                    return out;
                }
            });
            this.stickit(app.time);
            return this;
        },
        getDates: function() {
            var fromVal = this.$FromDate.datebox('getValue');
            var toVal = this.$ToDate.datebox('getValue');
            var fromDate = fromVal ? moment(fromVal, 'DD.MM.YYYY').toJSON() : null;
            var toDate = toVal ? moment(toVal, 'DD.MM.YYYY').toJSON() : null;
            console.log(fromDate);
            return {
                from: fromDate,
                to: toDate
            };
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
            row.status = status;
            switch (status) {
                case 0:
                    return '<span style="color:olive;">' + i18n.t('examStatus.0') + '</span>';
                case 1:
                    return '<span style="color:teal;">' + i18n.t('examStatus.1') + '</span>';
                case 2:
                    return '<span style="color:orange;">' + i18n.t('examStatus.2') + '</span>';
                case 3:
                    return '<span style="color:red;">' + i18n.t('examStatus.3') + '</span>';
                case 4:
                    return '<span style="color:green;">' + i18n.t('examStatus.4') + '</span>';
                case 5:
                    return '<span style="color:purple;">' + i18n.t('examStatus.5') + '</span>';
                case 6:
                    return '<span style="color:gray;">' + i18n.t('examStatus.6') + '</span>';
                default:
                    return null;
            }
        },
        formatAction: function(val, row) {
            if (!row.beginDate) return;
            var tpl = _.template(this.templates['action-item-tpl']);
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
                i18n: i18n,
                examId: row._id
            };
            return isAllow() ? tpl(data) : null;
        },
        formatDuration: function(val, row) {
            if (!val) return;
            return i18n.t('monitor.durationValue', {
                duration: val
            });
        },
        formatDate: function(val, row) {
            if (!val) return;
            return moment(val).format('DD.MM.YYYY HH:mm');
        },
        formatSubject: function(val, row) {
            if (!val || !row) return;
            var tpl = _.template(this.templates['subject-item-tpl']);
            return tpl({
                i18n: i18n,
                examId: row._id,
                subject: val
            });
        },
        formatStudent: function(val, row) {
            if (!val) return;
            var data = {
                i18n: i18n,
                userId: val._id,
                lastname: val.lastname,
                firstname: val.firstname,
                middlename: val.middlename
            };
            var tpl = _.template(this.templates['student-item-tpl']);
            return tpl(data);
        },
        formatInspector: function(val, row) {
            if (!val) return;
            var data = {
                i18n: i18n,
                userId: val._id,
                lastname: val.lastname,
                firstname: val.firstname,
                middlename: val.middlename
            };
            var tpl = _.template(this.templates['inspector-item-tpl']);
            return tpl(data);
        },
        doSearch: function() {
            var myself = true;
            switch (true) {
                case this.$StatusBtn1.linkbutton('options').selected:
                    myself = true;
                    break;
                case this.$StatusBtn2.linkbutton('options').selected:
                    myself = false;
                    break;
            }
            var dates = this.getDates();
            this.$Grid.datagrid('load', {
                myself: myself,
                from: dates.from,
                to: dates.to
            });
        },
        doExamInfo: function(e) {
            var element = e.currentTarget;
            var examId = $(element).attr('data-id');
            this.view.exam.doOpen(examId);
        },
        doStudentInfo: function(e) {
            var element = e.currentTarget;
            var userId = $(element).attr('data-id');
            this.view.passport.doOpen(userId);
        },
        doInspectorInfo: function(e) {
            var element = e.currentTarget;
            var userId = $(element).attr('data-id');
            this.view.profile.doOpen(userId);
        },
        doStart: function(e) {
            var element = e.currentTarget;
            var examId = $(element).attr('data-id');
            if (SINGLE_MODE) {
                app.router.navigate("vision/" + examId, {
                    trigger: true
                });
            }
            else {
                window.open("#vision/" + examId, examId);
            }
        }
    });
    return View;
});