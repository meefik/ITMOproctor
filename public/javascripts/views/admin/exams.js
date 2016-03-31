//
// Admin: Exams view
//
define([
    "i18n",
    "text!templates/admin/exams.html",
    "views/exam/viewer",
    "views/exam/editor",
    "views/profile/viewer",
    "views/passport/viewer"
], function(i18n, template, ExamViewer, ExamEditor, ProfileViewer, PassportViewer) {
    console.log('views/admin/exams.js');
    var View = Backbone.View.extend({
        events: {
            "click .exam-btn": "doExamInfo",
            "click .student-btn": "doStudentInfo",
            "click .inspector-btn": "doInspectorInfo",
            "click .play-btn": "doPlay"
        },
        initialize: function(options) {
            // Variables
            this.options = options || {};
            // Templates
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
                examViewer: new ExamViewer(),
                examEditor: new ExamEditor(),
                profileViewer: new ProfileViewer(),
                passportViewer: new PassportViewer()
            };
        },
        destroy: function() {
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

            // Menu events
            this.$Menu = $('#exams-menu');
            this.$Menu.menu({
                onClick: function(item) {
                    switch (item.name) {
                        case "add":
                            self.doAdd();
                            break;
                        case "edit":
                            self.doEdit();
                            break;
                        case "remove":
                            self.doRemove();
                            break;
                        case "export":
                            self.doExport();
                            break;
                    }
                }
            });
            // Event handlers
            this.$FromDate = this.$(".date-from");
            this.$FromDate.datebox({
                value: app.now().format("DD.MM.YYYY"),
                delay: 0,
                onChange: function(date) {
                    var valid = moment(date, "DD.MM.YYYY", true).isValid();
                    if (!date || valid) self.doSearch();
                }
            });
            this.$ToDate = this.$(".date-to");
            this.$ToDate.datebox({
                value: app.now().add(1, 'days').format("DD.MM.YYYY"),
                delay: 0,
                onChange: function(date) {
                    var valid = moment(date, "DD.MM.YYYY", true).isValid();
                    if (!date || valid) self.doSearch();
                }
            });
            this.$TextSearch = this.$(".text-search");
            this.$TextSearch.searchbox({
                searcher: function(value, name) {
                    self.doSearch();
                }
            });
            var now = app.now();
            this.$Grid = this.$("#exams-grid");
            this.$Grid.datagrid({
                columns: [
                    [{
                        field: 'student',
                        title: i18n.t('admin.exams.student'),
                        width: 150,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: function(value, row, index) {
                            return self.formatStudent(value, row);
                        }
                    }, {
                        field: 'inspector',
                        title: i18n.t('admin.exams.inspector'),
                        width: 150,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: function(value, row, index) {
                            return self.formatInspector(value, row);
                        }
                    }, {
                        field: 'subject',
                        title: i18n.t('admin.exams.subject'),
                        width: 200,
                        sortable: true,
                        formatter: function(value, row, index) {
                            return self.formatSubject(value, row);
                        }
                    }, {
                        field: 'beginDate',
                        title: i18n.t('admin.exams.beginDate'),
                        width: 150,
                        sortable: true,
                        formatter: self.formatDate
                    }, {
                        field: 'duration',
                        title: i18n.t('admin.exams.duration'),
                        width: 100,
                        sortable: true,
                        formatter: self.formatDuration
                    }, {
                        field: 'status',
                        title: i18n.t('admin.exams.status'),
                        width: 100,
                        sortable: true,
                        formatter: self.formatStatus
                    }, {
                        field: 'action',
                        title: '&nbsp;&nbsp;&nbsp;&nbsp;',
                        align: 'center',
                        formatter: self.formatAction.bind(this)
                    }]
                ],
                remoteSort: false,
                pagination: true,
                pageNumber: 1,
                pageSize: 50,
                pageList: [10, 50, 100, 250, 500, 1000, 10000],
                rownumbers: true,
                ctrlSelect: true,
                url: 'admin/exams',
                method: 'get',
                queryParams: {
                    from: now.startOf('day').toJSON(),
                    to: now.startOf('day').add(1, 'days').toJSON()
                },
                loadFilter: function(data) {
                    data = data || [];
                    var text = self.$TextSearch.textbox('getValue').trim();
                    if (_.isEmpty(text)) return data;
                    else {
                        var rows = _.textSearch(data.rows, text);
                        return {
                            rows: rows,
                            total: rows.length
                        };
                    }
                }
            });
        },
        getDates: function() {
            var fromVal = this.$FromDate.datebox('getValue');
            var toVal = this.$ToDate.datebox('getValue');
            var fromDate = fromVal ? moment(fromVal, 'DD.MM.YYYY').toJSON() : null;
            var toDate = toVal ? moment(toVal, 'DD.MM.YYYY').toJSON() : null;
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
                    return '<span style="color:olive;">' + i18n.t('exam.status.0') + '</span>';
                case 1:
                    return '<span style="color:teal;">' + i18n.t('exam.status.1') + '</span>';
                case 2:
                    return '<span style="color:orange;">' + i18n.t('exam.status.2') + '</span>';
                case 3:
                    return '<span style="color:red;">' + i18n.t('exam.status.3') + '</span>';
                case 4:
                    return '<span style="color:green;">' + i18n.t('exam.status.4') + '</span>';
                case 5:
                    return '<span style="color:purple;">' + i18n.t('exam.status.5') + '</span>';
                case 6:
                    return '<span style="color:gray;">' + i18n.t('exam.status.6') + '</span>';
                default:
                    return null;
            }
        },
        formatDuration: function(val, row) {
            if (!val) return;
            return i18n.t('admin.exams.durationValue', {
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
                row: row
            });
        },
        formatStudent: function(val, row) {
            if (!val) return;
            var data = {
                i18n: i18n,
                row: row
            };
            var tpl = _.template(this.templates['student-item-tpl']);
            return tpl(data);
        },
        formatInspector: function(val, row) {
            if (!val) return;
            var data = {
                i18n: i18n,
                row: row
            };
            var tpl = _.template(this.templates['inspector-item-tpl']);
            return tpl(data);
        },
        formatAction: function(val, row) {
            if (!row.startDate) return;
            var tpl = _.template(this.templates['action-item-tpl']);
            var data = {
                i18n: i18n,
                row: row
            };
            return tpl(data);
        },
        doSearch: function() {
            var dates = this.getDates();
            this.$Grid.datagrid('load', {
                from: dates.from,
                to: dates.to
            });
        },
        doExamInfo: function(e) {
            var element = e.currentTarget;
            var examId = $(element).attr('data-id');
            this.view.examViewer.doOpen(examId);
        },
        doStudentInfo: function(e) {
            var element = e.currentTarget;
            var userId = $(element).attr('data-id');
            this.view.passportViewer.doOpen(userId);
        },
        doInspectorInfo: function(e) {
            var element = e.currentTarget;
            var userId = $(element).attr('data-id');
            this.view.profileViewer.doOpen(userId);
        },
        doPlay: function(e) {
            var element = e.currentTarget;
            var examId = $(element).attr('data-id');
            this.options.parent.renderTab({
                id: 'play',
                text: i18n.t('play.title'),
                params: {
                    examId: examId
                }
            });
        },
        doAdd: function() {
            var self = this;
            var callback = function() {
                self.$Grid.datagrid('reload');
            };
            this.view.examEditor.doOpen(null, callback);
        },
        doEdit: function() {
            var selected = this.$Grid.datagrid('getSelected');
            if (!selected) return;
            var self = this;
            var callback = function() {
                self.$Grid.datagrid('reload');
            };
            this.view.examEditor.doOpen(selected._id, callback);
        },
        removeRows: function(rows) {
            var self = this;
            var User = Backbone.Model.extend({
                urlRoot: 'exam'
            });
            var onProgress = _.progressMessager(
                i18n.t('admin.remove.progressMsg'),
                rows.length,
                function() {
                    self.$Grid.datagrid('reload');
                });
            rows.forEach(function(row, i, arr) {
                _.defer(function() {
                    var user = new User({
                        _id: row._id
                    });
                    user.destroy({
                        success: onProgress,
                        error: onProgress
                    });
                });
            });
        },
        doRemove: function() {
            var selected = this.$Grid.datagrid('getSelections');
            if (!selected.length) return;
            var self = this;
            $.messager.confirm(i18n.t('admin.remove.confirm.title'),
                i18n.t('admin.remove.confirm.message'),
                function(r) {
                    if (r) self.removeRows(selected);
                });
        }
    });
    return View;
});