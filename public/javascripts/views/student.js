//
// Student view
//
define([
    "i18n",
    "text!templates/student.html",
    "views/exam",
    "views/settings",
    "views/planner",
    "views/passport-editor",
    "views/demo"
], function(i18n, template, ExamView, SettingsView, PlannerView, PassportEditorView, DemoView) {
    console.log('views/student.js');
    var View = Backbone.View.extend({
        events: {
            "click .start-btn": "doStart",
            "click .plan-btn": "doPlan",
            "click .revoke-btn": "doRevoke",
            "click .exam-btn": "doExamInfo"
        },
        bindings: {
            '.server-time': {
                observe: 'time',
                onGet: function(val) {
                    return moment(val).format('HH:mm:ss');
                }
            },
            '.countdown-time': {
                observe: 'time',
                onGet: function(val) {
                    var out = '0.00:00:00';
                    if (this.nextExam) {
                        var beginDate = this.nextExam.beginDate;
                        var diff = moment(beginDate).diff(val);
                        if (diff > 0) {
                            var days = moment.duration(diff, 'ms').days();
                            var times = moment(diff).utc().format('HH:mm:ss');
                            out = days + '.' + times;
                        }
                    }
                    return out;
                }
            }
        },
        initialize: function() {
            // Variables
            this.historyFlag = false;
            // Templates
            this.templates = _.parseTemplate(template);
            // Exam model
            var Exam = Backbone.Model.extend({
                urlRoot: 'student/exam'
            });
            this.exam = new Exam();
            // Sub views
            this.view = {
                settings: new SettingsView(),
                passport: new PassportEditorView(),
                exam: new ExamView(),
                demo: new DemoView(),
                planner: new PlannerView()
            };
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
            this.$StartBtn = this.$('.start-btn');
            this.$PlanBtn = this.$('.plan-btn');
            this.$RevokeBtn = this.$('.revoke-btn');
            this.$Grid = this.$('.exams-table');
            this.$Menu.menu({
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
            this.$Grid.datagrid({
                columns: [
                    [{
                        field: 'subject',
                        title: i18n.t('student.subject'),
                        width: 200,
                        formatter: function(value, row, index) {
                            return self.formatSubject(value, row, index);
                        }
                    }, {
                        field: 'beginDate',
                        title: i18n.t('student.begin'),
                        width: 150,
                        formatter: function(value, row, index) {
                            return self.formatDate(value, row, index);
                        }
                    }, {
                        field: 'duration',
                        title: i18n.t('student.duration'),
                        width: 100,
                        formatter: function(value, row, index) {
                            return self.formatDuration(value, row, index);
                        }
                    }, {
                        field: 'status',
                        title: i18n.t('student.status'),
                        width: 100,
                        formatter: function(value, row, index) {
                            return self.formatStatus(value, row, index);
                        }
                    }]
                ],
                url: 'student/exam',
                method: 'get',
                onSelect: function(index, row) {
                    if (!row) return;
                    self.exam.set(row);
                    var rightDate = moment(row.rightDate);
                    var beginDate = moment(row.beginDate);
                    var endDate = moment(row.endDate);
                    var now = app.now();
                    self.$PlanBtn.hide();
                    self.$RevokeBtn.hide();
                    self.$StartBtn.hide();
                    if (row.rightDate && rightDate < now) {}
                    else if (!row.beginDate || !row.endDate) {
                        self.$PlanBtn.show();
                    }
                    else if (beginDate > now &&
                        beginDate >= now.add(self.offset, 'hours').startOf('hour')) {
                        self.$RevokeBtn.show();
                    }
                    else if (beginDate <= now && !row.stopDate &&
                        (endDate > now || row.startDate)) {
                        self.$StartBtn.show();
                    }
                },
                onLoadSuccess: function(data) {
                    //$(this).datagrid('getPanel').find('.easyui-tooltip').tooltip({
                    //    position: 'right'
                    //});
                    var now = app.now();
                    self.offset = data.offset;
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
                            self.$Grid.datagrid('selectRow', k);
                            return;
                        }
                    }
                    self.$Grid.datagrid('selectRow', 0);
                }
            });
            this.stickit(app.time);
            return this;
        },
        destroy: function() {
            for (var v in this.view) {
                if (this.view[v]) this.view[v].destroy();
            }
            this.remove();
        },
        toggleHistory: function(item) {
            this.historyFlag = !this.historyFlag;
            if (this.historyFlag) {
                this.$Menu.menu('setIcon', {
                    target: item.target,
                    iconCls: 'fa fa-dot-circle-o'
                });
            }
            else {
                this.$Menu.menu('setIcon', {
                    target: item.target,
                    iconCls: 'fa fa-circle-o'
                });
            }
            this.refreshTable();
        },
        refreshTable: function() {
            this.$Grid.datagrid({
                queryParams: {
                    history: this.historyFlag ? '1' : '0'
                }
            });
        },
        doStart: function() {
            var selected = this.$Grid.datagrid('getSelected');
            var disabled = this.$StartBtn.linkbutton('options').disabled;
            if (selected && !disabled) {
                app.router.navigate("student/" + selected._id, {
                    trigger: true
                });
            }
        },
        doPlan: function() {
            var selected = this.$Grid.datagrid('getSelected');
            var disabled = this.$PlanBtn.linkbutton('options').disabled;
            if (selected && !disabled) {
                var self = this;
                this.view.planner.doOpen(selected, function(date) {
                    self.exam.save({
                        beginDate: date
                    }, {
                        success: function(model) {
                            self.refreshTable();
                        }
                    });
                });
            }
        },
        doRevoke: function() {
            var self = this;
            $.messager.confirm(i18n.t('student.confirm'), i18n.t('student.revokeMessage'), function(r) {
                if (r) {
                    self.exam.destroy({
                        success: function(model) {
                            self.refreshTable();
                        }
                    });
                }
            });
        },
        formatDuration: function(val, row) {
            if (!val) return;
            return i18n.t('student.durationValue', {
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
        doExamInfo: function(e) {
            var element = e.currentTarget;
            var examId = $(element).attr('data-id');
            this.view.exam.doOpen(examId);
        }
    });
    return View;
});