//
// VerifyMaker view
//
define([
    "i18n",
    "text!templates/verify/maker.html",
    "collections/attach"
], function(i18n, template, Attach) {
    console.log('views/verify/maker.js');
    var View = Backbone.View.extend({
        initialize: function(options) {
            this.options = options || {};
            this.templates = _.parseTemplate(template);
            this.timer = null;
            var Verify = Backbone.Model.extend({
                urlRoot: 'verify'
            });
            this.model = new Verify();
            this.attach = new Attach();
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
                }],
                onOpen: function() {
                    $(this).dialog('center');
                    self.model.clear();
                    self.paused = false;
                    var tpl = _.template(self.templates['verify-tpl']);
                    var html = tpl({
                        i18n: i18n,
                        user: self.user
                    });
                    self.$Data.html(html);
                    self.takePhoto();
                    self.playVideo();
                },
                onClose: function() {
                    self.stopVideo();
                    self.attach.reset();
                }
            });
            this.$Dialog = $(dialog);
            this.$Photo = this.$('.verify-photo');
            this.$Document = this.$('.verify-document');
            this.$Data = this.$('.verify-data');
            return this;
        },
        canvasToContext: function(video, $canvas) {
            var canvas = $canvas.get(0);
            var proportion = video.videoWidth / video.videoHeight;
            canvas.width = Math.floor($canvas.height() * proportion);
            canvas.height = $canvas.height();
            return canvas.getContext('2d');
        },
        playVideo: function() {
            var context = this.canvasToContext(this.video, this.$Document);
            var self = this;
            this.timer = setInterval(function() {
                if (self.paused) return false;
                context.drawImage(self.video, 0, 0, context.canvas.width, context.canvas.height);
            }, 20);
        },
        stopVideo: function() {
            clearInterval(this.timer);
        },
        takePhoto: function() {
            var context = this.canvasToContext(this.video, this.$Photo);
            context.drawImage(this.video, 0, 0, context.canvas.width, context.canvas.height);
        },
        toggleVideo: function() {
            this.paused = !this.paused;
            if (this.paused) this.saveAttach();
        },
        saveAttach: function() {
            this.attach.reset();
            this.attach.create({
                file: _.dataUrlToFile(this.$Photo.get(0).toDataURL(), 'photo.png', 'image/png')
            });
            this.attach.create({
                file: _.dataUrlToFile(this.$Document.get(0).toDataURL(), 'document.png', 'image/png')
            });
        },
        submitData: function(submit) {
            var verifiedData = {
                examId: this.examId,
                studentId: this.user._id,
                submit: submit,
                firstname: this.user.firstname,
                lastname: this.user.lastname,
                middlename: this.user.middlename,
                gender: this.user.gender,
                birthday: this.user.birthday,
                citizenship: this.user.citizenship,
                documentType: this.user.documentType,
                documentNumber: this.user.documentNumber,
                documentIssueDate: this.user.documentIssueDate,
                address: this.user.address,
                description: this.user.description,
                attach: this.attach.toJSON()
            };
            this.model.save(verifiedData, this.options);
        },
        doAccept: function() {
            if (!this.paused) return;
            this.submitData(true);
            this.doClose();
        },
        doReject: function() {
            if (!this.paused) return;
            this.submitData(false);
            this.doClose();
        },
        doOpen: function(video, examId, user, options) {
            //if (video.paused || video.ended) return;
            this.video = video;
            this.user = user;
            this.examId = examId;
            this.options = options;
            this.$Dialog.dialog('open');
        },
        doClose: function() {
            this.$Dialog.dialog('close');
        }
    });
    return View;
});