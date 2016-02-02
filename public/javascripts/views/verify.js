//
// Verify view
//
define([
    "i18n",
    "text!templates/verify.html"
], function(i18n, template) {
    console.log('views/verify.js');
    var View = Backbone.View.extend({
        initialize: function() {
            this.templates = _.parseTemplate(template);
            this.timer = null;
            this.render();
        },
        destroy: function() {
            clearInterval(this.timer);
            this.remove();
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            var dialog = $(this.el).dialog({
                title: i18n.t('verify.title'),
                width: 670,
                height: 570,
                closed: true,
                modal: true,
                content: tpl(data),
                buttons: [{
                    text: i18n.t('verify.scanBtn'),
                    iconCls: 'fa fa-clone',
                    handler: this.toggleVideo.bind(this)
                }, {
                    text: i18n.t('verify.acceptBtn'),
                    iconCls: 'fa fa-check',
                    handler: this.doAccept.bind(this)
                }, {
                    text: i18n.t('verify.rejectBtn'),
                    iconCls: 'fa fa-times',
                    handler: this.doReject.bind(this)
                }, ],
                onOpen: function() {
                    $(this).dialog('center');
                    self.paused = false;
                    var tpl = _.template(self.templates['verify-tpl']);
                    var html = tpl({
                        i18n: i18n,
                        user: self.user
                    });
                    self.$Data.html(html);
                    self.playVideo();
                },
                onClose: function() {
                    self.stopVideo();
                }
            });
            this.$Dialog = $(dialog);
            this.$Photo = this.$('.verify-photo');
            this.$Video = this.$('.verify-video');
            this.$Data = this.$('.verify-data');
            return this;
        },
        playVideo: function() {
            var self = this;
            var canvas = this.$Video.get(0);
            var photo = this.$Photo.get(0);
            var context = canvas.getContext('2d');
            var cw = this.$Video.width();
            var ch = this.$Video.height();
            var proportion = ch / cw;
            //console.log(cw + 'x' + ch);
            cw = 640;
            ch = Math.floor(640 * proportion);
            canvas.width = cw;
            canvas.height = ch;
            this.timer = setInterval(function() {
                if (self.paused) return false;
                if (self.video.paused || self.video.ended) {
                    return self.$Photo.attr('src', self.video.poster);
                }
                context.drawImage(self.video, 0, 0, cw, ch);
                if (!self.$Photo.attr('src')) {
                    self.$Photo.attr('src', canvas.toDataURL());
                }
            }, 20);
        },
        stopVideo: function() {
            clearInterval(this.timer);
            this.$Photo.attr('src', '');
        },
        toggleVideo: function() {
            this.paused = !this.paused;
        },
        submitData: function(submit) {
            var verified = {
                submit: submit,
                data: {
                    firstname: this.user.firstname,
                    lastname: this.user.lastname,
                    middlename: this.user.middlename,
                    gender: this.user.gender,
                    birthday: this.user.birthday,
                    citizenship: this.user.citizenship,
                    documentType: this.user.documentType,
                    documentNumber: this.user.documentNumber,
                    documentIssueDate: this.user.documentIssueDate
                }
            };
            var dataUrl = this.$Video.get(0).toDataURL();
            return this.callback(verified, dataUrl);
        },
        doAccept: function() {
            this.submitData(true);
            this.doClose();
        },
        doReject: function() {
            this.submitData(false);
            this.doClose();
        },
        doOpen: function(video, user, callback) {
            this.video = video;
            this.user = user;
            this.callback = callback;
            this.$Dialog.dialog('open');
        },
        doClose: function() {
            this.$Dialog.dialog('close');
        }
    });
    return View;
});