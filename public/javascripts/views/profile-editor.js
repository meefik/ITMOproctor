//
// ProfileEditor view
//
define([
    "i18n",
    "text!templates/profile-editor.html"
], function(i18n, template) {
    console.log('views/profile-editor.js');
    var View = Backbone.View.extend({
        events: {
            "click .avatar": "doAttach",
            "change .attach-file": "onFileChange",
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
            var dialog = $(this.el).dialog({
                title: i18n.t('profile.title'),
                width: 500,
                height: 280,
                closed: true,
                modal: true,
                content: tpl(data),
                buttons: [{
                    text: i18n.t('profile.save'),
                    iconCls: 'fa fa-check',
                    handler: function() {
                        self.doSave();
                    }
                }, {
                    text: i18n.t('profile.close'),
                    iconCls: 'fa fa-times',
                    handler: function() {
                        self.doClose();
                    }
                }],
                onOpen: function() {
                    $(this).dialog('center');
                    // Load form data
                    self.$EditForm.form('load', app.profile.toJSON());
                    // Load image
                    self.attach = JSON.parse(JSON.stringify(app.profile.get('attach')));
                    if (self.attach[0]) self.$Avatar.attr('src', 'storage/' + self.attach[0].fileId);
                },
                onClose: function() {
                    self.$EditForm.form('clear');
                    self.$Progress.hide();
                    self.$Avatar.attr('src', 'images/avatar.png');
                    self.$AttachForm.trigger('reset');
                }
            });
            this.$Dialog = $(dialog);
            this.$EditForm = this.$('.profile-form');
            this.$AttachForm = this.$('.attach-form');
            this.$Avatar = this.$('.avatar');
            this.$Attach = this.$('.attach-file');
            this.$Progress = this.$('.attach-progress');
            return this;
        },
        removeAttach: function() {
            for (var i = 0, l = this.attach.length; i < l; i++) {
                this.attach[i].removed = true;
            }
        },
        doSave: function() {
            var self = this;
            var config = {
                attach: this.attach
            };
            this.$EditForm.serializeArray().map(function(item) {
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
        onFileChange: function() {
            var self = this;
            var limitSize = UPLOAD_LIMIT * 1024 * 1024; // MB
            var files = self.$Attach[0].files || [];
            if (!files.length || files[0].size > limitSize) return;
            var attach = files[0];
            var fd = new FormData(this.$AttachForm.get(0));
            //fd.append('attach', attach);
            // show progress
            self.$Progress.show();
            self.$Progress.progressbar({
                value: 0,
                text: _.truncateFilename(attach.name, 15)
            });
            // show image
            var reader = new FileReader();
            reader.onload = function(event) {
                self.$Avatar.attr('src', event.target.result);
            };
            reader.readAsDataURL(attach);
            $.ajax({
                type: 'post',
                url: 'storage',
                data: fd,
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.onprogress = function(progress) {
                        var percentage = Math.floor((progress.loaded / progress.total) * 100);
                        self.$Progress.progressbar('setValue', percentage);
                    };
                    return xhr;
                },
                processData: false,
                contentType: false
            }).done(function(respond) {
                self.removeAttach();
                // add new attach
                self.attach.push({
                    fileId: respond.fileId,
                    filename: respond.originalname,
                    uploadname: respond.filename
                });
                self.$Progress.hide();
            });
        },
        doAttach: function() {
            this.$Attach.trigger('click');
        },
        doRemoveAttach: function() {
            this.removeAttach();
            this.$Avatar.attr('src', 'images/avatar.png');
            this.$AttachForm.trigger('reset');
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