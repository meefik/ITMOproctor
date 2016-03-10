//
// Exam view
//
define([
    "i18n",
    "text!templates/exam.html"
], function(i18n, template) {
    console.log('views/exam.js');
    var View = Backbone.View.extend({
        initialize: function() {
            // Templates
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
            this.loadingMsg = tpl(data);
            var dialog = $(this.el).dialog({
                title: i18n.t('exam.title'),
                width: 500,
                height: 380,
                closed: true,
                modal: true,
                content: this.loadingMsg,
                buttons: [{
                    text: i18n.t('exam.close'),
                    iconCls: 'fa fa-times',
                    handler: function() {
                        self.doClose();
                    }
                }],
                onOpen: function() {
                    $(this).dialog('center');
                }
            });
            this.$Dialog = $(dialog);
            this.$Container = this.$Dialog.find('.dialog-container');
            return this;
        },
        doOpen: function(examId) {
            var self = this;
            this.$Container.html(this.loadingMsg);
            var tpl = _.template(this.templates['dialog-tpl']);
            this.model.set('_id', examId);
            this.model.fetch({
                success: function(model) {
                    var data = {
                        i18n: i18n,
                        exam: model.toJSON()
                    };
                    self.$Container.html(tpl(data));
                }
            });
            this.$Dialog.dialog('open');
        },
        doClose: function() {
            this.$Dialog.dialog('close');
        }
    });
    return View;
});
