//
// PassportEditor view
//
define([
    "i18n",
    "text!templates/passport/editor.html"
], function(i18n, template) {
    console.log('views/passport/editor.js');
    var View = Backbone.View.extend({
        initialize: function(options) {
            this.templates = _.parseTemplate(template);
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
                title: i18n.t('user.title'),
                width: 500,
                height: 480,
                closed: true,
                modal: true,
                content: tpl(data),
                buttons: [{
                    text: i18n.t('user.save'),
                    iconCls: 'fa fa-check',
                    handler: function() {
                        self.doSave();
                    }
                }, {
                    text: i18n.t('user.close'),
                    iconCls: 'fa fa-times',
                    handler: function() {
                        self.doClose();
                    }
                }],
                onOpen: function() {
                    $(this).dialog('center');
                    self.$From.form('load', app.profile.toJSON());
                },
                onClose: function() {
                    self.$From.form('clear');
                }
            });
            this.$Dialog = $(dialog);
            this.$From = this.$('.passport-form');
            return this;
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
                    config[item.name] = item.value;
                }
            });
            app.profile.save(config, {
                success: function(model) {
                    self.doClose();
                }
            });
        },
        doOpen: function() {
            this.$Dialog.dialog('open');
        },
        doClose: function() {
            this.$Dialog.dialog('close');
        }
    });
    return View;
});