//
// Chat view
//
define([
    "i18n",
    "text!templates/chat.html"
], function(i18n, template) {
    console.log('views/chat.js');
    var View = Backbone.View.extend({
        className: "chat-view",
        events: {
            "click .chat-send-btn": "doSend",
            "click .chat-attach-btn": "doAttach",
            "click .chat-file-btn": "doReset",
            "keyup .chat-input": "doInputKeyup",
            "change .chat-attach-input": "doFileChange",
            "click .attach-link": "doDownload"
        },
        initialize: function(options) {
            // Variables
            var self = this;
            this.options = options || {};
            this.attach = [];
            // Templates
            this.templates = _.parseTemplate(template);
            // Single item view
            this.ItemView = Backbone.View.extend({
                tagName: "li",
                initialize: function() {
                    //console.log('initialize');
                    this.tpl = _.template(self.templates['chat-item-tpl']);
                    this.listenTo(this.model, 'change', this.render);
                    this.listenTo(this.model, 'destroy', this.remove);
                },
                render: function() {
                    //console.log('render');
                    this.$el.html(this.tpl({
                        i18n: i18n,
                        message: this.model.toJSON()
                    }));
                    return this;
                }
            });
            // Chat collection
            var Chat = Backbone.Collection.extend({
                url: 'chat/' + this.options.examId,
                comparator: 'time'
            });
            this.collection = new Chat();
            this.listenTo(this.collection, 'add', this.appendItem);
            // Audio notification
            this.audio = new Audio("sounds/alert.ogg");
            // Socket notification
            app.io.notify.on('chat-' + this.options.examId, function(data) {
                if (!app.isMe(data.userId)) {
                    self.collection.fetch({
                        success: function() {
                            self.audio.play();
                        }
                    });
                }
            });
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
            this.$Panel = this.$(".chat-panel");
            this.$Form = this.$("form");
            this.$Input = this.$(".chat-input");
            this.$Output = this.$(".chat-output");
            this.$FileBtn = this.$(".chat-file-btn");
            this.$AttachInput = this.$(".chat-attach-input");
            this.$AttachBtn = this.$(".chat-attach-btn");
            this.$Progress = this.$(".chat-progress");
            this.collection.fetch({
                success: function(model, response, options) {
                    self.createMessage(i18n.t('chat.connect'));
                }
            });
        },
        destroy: function() {
            app.io.notify.removeListener('chat-' + this.options.examId);
            this.remove();
        },
        createMessage: function(text) {
            var author = {
                _id: app.profile.get('_id'),
                lastname: app.profile.get('lastname'),
                firstname: app.profile.get('firstname'),
                middlename: app.profile.get('middlename')
            };
            this.collection.create({
                time: app.now(),
                author: author,
                text: text,
                attach: this.attach
            });
        },
        doSend: function() {
            var text = this.$Input.text();
            if (text || this.attach.length > 0) {
                this.createMessage(text);
            }
            this.doReset();
        },
        appendItem: function(model) {
            var view = new this.ItemView({
                model: model
            });
            this.$Output.append(view.render().el);
            this.$Panel.scrollTop(this.$Panel[0].scrollHeight);
        },
        doInputKeyup: function(e) {
            if (e.keyCode == 13) {
                this.doSend();
            }
        },
        doAttach: function() {
            if (this.attach.length > 0) return;
            this.$AttachInput.trigger('click');
        },
        doReset: function() {
            this.attach = [];
            this.$Input.html('');
            this.$FileBtn.hide();
            this.$AttachBtn.linkbutton('enable');
            this.$Form.trigger('reset');
        },
        doFileChange: function() {
            var self = this;
            var limitSize = UPLOAD_LIMIT * 1024 * 1024; // bytes
            var formdata = new FormData();
            var files = self.$AttachInput.get(0).files;
            if (files.length === 0) return;
            if (files[0].size > limitSize) {
                $.messager.show({
                    title: i18n.t('chat.limitMessage.title'),
                    msg: i18n.t('chat.limitMessage.message', {
                        num: UPLOAD_LIMIT
                    }),
                    showType: 'fade',
                    style: {
                        right: '',
                        bottom: ''
                    }
                });
                return;
            }
            formdata.append(0, files[0]);
            self.$Progress.progressbar('setColor', null);
            self.$FileBtn.show();
            self.$AttachBtn.linkbutton('disable');
            self.$Progress.progressbar({
                value: 0,
                text: _.truncateFilename(files[0].name, 15)
            });
            $.ajax({
                type: 'post',
                url: 'storage',
                data: formdata,
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
                //console.log(respond);
                self.attach.push({
                    fileId: respond.fileId,
                    filename: respond.originalname,
                    uploadname: respond.name
                });
                self.$Progress.progressbar('setColor', 'green');
            });
        },
        doDownload: function(e) {
            return _.isHttpStatusOK(e.currentTarget.href);
        }
    });
    return View;
});