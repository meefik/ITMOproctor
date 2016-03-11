//
// ExamEditor view
//
define([
    "i18n",
    "text!templates/exam/editor.html"
], function(i18n, template) {
    console.log('views/exam/editor.js');
    var View = Backbone.View.extend({
        events: {
            "click .upd-inspector-list": "getInspectors"
        },
        initialize: function(options) {
            this.templates = _.parseTemplate(template);
            // Exam model
            var Exam = Backbone.Model.extend({
                urlRoot: 'exam'
            });
            this.model = new Exam();
            this.render();
        },
        destroy: function() {
            this.remove();
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            var dialog = $(this.el).dialog({
                title: i18n.t('exam.title'),
                width: 500,
                height: 500,
                closed: true,
                modal: true,
                content: tpl(data),
                buttons: [{
                    text: i18n.t('exam.save'),
                    iconCls: 'fa fa-check',
                    handler: function() {
                        self.doSave();
                    }
                }, {
                    text: i18n.t('exam.close'),
                    iconCls: 'fa fa-times',
                    handler: function() {
                        self.doClose();
                    }
                }],
                onOpen: function() {
                    $(this).dialog('center');
                    if (self.model.get('_id')) self.model.fetch({
                        success: function(model) {
                            var m = model.toJSON();
                            if (m.student) m.student = String(m.student._id);
                            if (m.inspector) m.inspector = String(m.inspector._id);
                            else m.inspector = 'null';
                            if (typeof m.resolution !== 'undefined') {
                                m.resolution = String(m.resolution);
                            }
                            self.$From.form('load', m);
                        }
                    });
                }
            });

            this.$Dialog = $(dialog);
            this.$From = this.$('.exam-form');
            
            this.$ExamId = this.$('.examId');
            this.$ExamId.textbox({
                buttonText: i18n.t('exam.reset'),
                onClickButton: function() {
                    $(this).textbox('setValue', _.uuid());
                }
            });
            this.$ExamCode = this.$('.examCode');
            this.$ExamCode.textbox({
                buttonText: i18n.t('exam.reset'),
                onClickButton: function() {
                    $(this).textbox('setValue', _.uuid());
                }
            });

            this.$StudentList = this.$('.student-list');
            this.$StudentList.combobox({
                valueField: 'id',
                textField: 'text',
            	filter: function(q, row){
            		var opts = $(this).combobox('options');
            		return ~row[opts.textField].indexOf(q);
            	}
            });
            this.$InspectorList = this.$('.inspector-list');
            this.$InspectorList.combobox({
                valueField: 'id',
                textField: 'text',
            	filter: function(q, row){
            		var opts = $(this).combobox('options');
            		return ~row[opts.textField].indexOf(q);
            	}
            });

            var parser = function(s) {
                var t;
                if (moment(s, ["DD.MM.YYYY HH:mm:ss"]).isValid()) {
                    t = moment(s, "DD.MM.YYYY HH:mm:ss").toDate();
                }
                else {
                    t = moment(s).toDate();
                }
                if (isNaN(t)) return new Date();
                else return t;
            };
            this.$LeftDate = this.$('.leftDate');
            this.$LeftDate.datebox({
                parser: parser,
                formatter: function(date) {
                    return moment(date).startOf('day').format("DD.MM.YYYY");
                }
            });
            this.$RightDate = this.$('.rightDate');
            this.$RightDate.datebox({
                parser: parser,
                formatter: function(date) {
                    return moment(date).startOf('day').format("DD.MM.YYYY");
                }
            });
            this.$BeginDate = this.$('.beginDate');
            this.$BeginDate.datetimebox({
                parser: parser,
                formatter: function(date) {
                    return moment(date).startOf('hour').format("DD.MM.YYYY HH:mm");
                }
            });
            this.$EndDate = this.$('.endDate');
            this.$EndDate.datetimebox({
                parser: parser,
                formatter: function(date) {
                    return moment(date).startOf('hour').format("DD.MM.YYYY HH:mm");
                }
            });
            this.$StartDate = this.$('.startDate');
            this.$StartDate.datetimebox({
                parser: parser,
                formatter: function(date) {
                    return moment(date).format("DD.MM.YYYY HH:mm");
                }
            });
            this.$StopDate = this.$('.stopDate');
            this.$StopDate.datetimebox({
                parser: parser,
                formatter: function(date) {
                    return moment(date).format("DD.MM.YYYY HH:mm");
                }
            });

            return this;
        },
        getStudents: function() {
            var self = this;
            $.ajax({
                url: "admin/users",
                data: {
                    role: 1
                },
                success: function(response) {
                    var students = response.rows;
                    if (students) {
                        var data = [];
                        students.forEach(function(item, ind, arr) {
                            var info = " " + item.firstname + " " + item.middlename + " (" + (item.username) + ")";
                            var student = {
                                id: item._id,
                                text: item.lastname ? item.lastname + info : i18n.t('exam.unknown') + info
                            };
                            data.push(student);
                        });
                        self.$StudentList.combobox('loadData', data);
                    }
                }
            });
        },
        getInspectors: function() {
            var self = this;
            $.ajax({
                url: "admin/users",
                data: {
                    role: 2
                },
                success: function(response) {
                    var inspectors = response.rows;
                    if (inspectors) {
                        var data = [];
                        data.push({
                            id: "null",
                            text: i18n.t('exam.unset')
                        });
                        inspectors.forEach(function(item, ind, arr) {
                            var info = " " + item.firstname + " " + item.middlename + " (" + (item.username) + ")";
                            var inspector = {
                                id: item._id,
                                text: item.lastname ? item.lastname + info : i18n.t('exam.unknown') + info
                            };
                            data.push(inspector);
                        });
                        self.$InspectorList.combobox('loadData', data);
                    }
                }
            });
        },
        doSave: function() {
            if (!this.$From.form('validate')) return;
            var self = this;
            var config = {};
            this.$From.serializeArray().map(function(item) {
                if (config[item.name]) {
                    if (typeof(config[item.name]) === "string") {
                        config[item.name] = [config[item.name]];
                    }
                    config[item.name].push(item.value);
                }
                else {
                    if (item.value === "null" || item.value === "") item.value = null;
                    if (item.name == "duration" && item.value != null) item.value = parseInt(item.value);
                    if (item.name == "leftDate" || item.name == "rightDate") {
                        if (item.value) item.value = moment(item.value, 'DD.MM.YYYY');
                    }
                    if (item.name == "beginDate" || item.name == "endDate") {
                        if (item.value) item.value = moment(item.value, 'DD.MM.YYYY HH:mm');
                    }
                    if (item.name == "startDate" || item.name == "stopDate") {
                        if (item.value) item.value = moment(item.value, 'DD.MM.YYYY HH:mm:ss');
                    }
                    // set config
                    config[item.name] = item.value;
                }
            });
            this.model.save(config, {
                success: function(model) {
                    self.callback();
                    self.doClose();
                }
            });
        },
        doOpen: function(examId, callback) {
            this.callback = callback;
            this.model.clear();
            if (examId) this.model.set('_id', examId);
            this.getStudents();
            this.getInspectors();
            this.$From.form('clear');
            this.$Dialog.dialog('open');
        },
        doClose: function() {
            this.$Dialog.dialog('close');
        }
    });
    return View;
});