//
// ProfileEditor view
//
define([
    "i18n",
    "text!templates/profile/editor.html",
    "collections/attach"
], function(i18n, template, Attach) {
    console.log('views/profile/editor.js');
    var View = Backbone.View.extend({
        events: {
            "click .avatar": "doAttach",
            "click .remove-attach": "doRemoveAttach"
        },
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
            // Attach
            this.attach = new Attach([], {
                onStart: function(file) {
                    self.$Progress.show();
                    self.$Progress.progressbar({
                        value: 0,
                        text: _.truncateFilename(file.name, 15)
                    });
                    // show image
                    var reader = new FileReader();
                    reader.onload = function(event) {
                        self.$Avatar.attr('src', event.target.result);
                    };
                    reader.readAsDataURL(file);
                    self.removeAttach();
                },
                onProgress: function(file, progress) {
                    var percentage = Math.floor((progress.loaded / progress.total) * 100);
                    self.$Progress.progressbar('setValue', percentage);
                },
                onDone: function(model) {
                    self.$Progress.hide();
                }
            });
            var dialog = $(this.el).dialog({
                title: i18n.t('user.title'),
                width: 500,
                height: 280,
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
                    // Load form data
                    self.$From.form('load', app.profile.toJSON());
                    // Load image
                    self.attach.reset(app.profile.get('attach'));
                    if (self.attach.at(0)) self.$Avatar.attr('src', 'storage/' + self.attach.at(0).get('fileId'));
                },
                onClose: function() {
                    self.$From.form('clear');
                    self.$Progress.hide();
                    self.$Avatar.attr('src', 'images/avatar.png');
                }
            });
            this.$Dialog = $(dialog);
            this.$From = this.$('.profile-form');
            this.$Avatar = this.$('.avatar');
            this.$Progress = this.$('.attach-progress');
            return this;
        },
        removeAttach: function() {
            for (var i = 0, l = this.attach.length; i < l; i++) {
                this.attach.at(i).set('removed', true);
            }
        },
        doSave: function() {
            var self = this;
            var config = {
                attach: this.attach.toJSON()
            };
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
        doAttach: function() {
            this.attach.create();
        },
        doRemoveAttach: function() {
            this.removeAttach();
            this.$Avatar.attr('src', 'images/avatar.png');
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