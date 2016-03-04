//
// Chat view
//
/* global _, Backbone, app */
define([
    "i18n",
    "text!templates/chat.html",
    "collections/attach"
], function(i18n, template, AttachCollection) {
    console.log('views/chat.js');
    var View = Backbone.View.extend({
        className: "chat-view",
        events: {
            "click .chat-send-btn": "doSend",
            "click .chat-attach-btn": "doAttach",
            "click .chat-file-btn": "doReset",
            "keyup .chat-input": "doInputKeyup",
            "click .attach-link": "doDownload"
        },
        initialize: function(options) {
            // Variables
            var self = this;
            this.options = options || {};
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
            // Attach
            this.attach = new AttachCollection();
            this.attach.callback = function(action, args) {
                switch (action) {
                    case 'limit':
                        $.messager.show({
                            title: i18n.t('chat.limitMessage.title'),
                            msg: i18n.t('chat.limitMessage.message', {
                                num: args.uploadLimit
                            }),
                            showType: 'fade',
                            style: {
                                right: '',
                                bottom: ''
                            }
                        });
                        break;
                    case 'start':
                        self.$Progress.progressbar('setColor', null);
                        self.$AttachBtn.hide();
                        self.$FileBtn.show();
                        self.$Progress.progressbar({
                            value: 0,
                            text: _.truncateFilename(args.file.name, 15)
                        });
                        break;
                    case 'progress':
                        var percentage = Math.floor((args.progress.loaded / args.progress.total) * 100);
                        self.$Progress.progressbar('setValue', percentage);
                        break;
                    case 'done':
                        self.$Progress.progressbar('setColor', 'green');
                        break;
                    case 'fail':
                        self.$Progress.progressbar('setColor', 'red');
                        break;
                }
            };
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
            this.$Form = this.$(".attach-form");
            this.$Input = this.$(".chat-input");
            this.$Output = this.$(".chat-output");
            this.$FileBtn = this.$(".chat-file-btn");
            this.$AttachInput = this.$(".chat-attach-input");
            this.$AttachBtn = this.$(".chat-attach-btn");
            this.$Progress = this.$(".chat-progress");
            this.$Templates = this.$(".chat-templates");
            this.$Templates.combo({
                onChange: function(newValue, oldValue) {
                    if (!newValue) return;
                    self.$Input.html(newValue);
                    self.$Templates.combobox("clear");
                }
            });
            this.$Templates.combobox("clear");
            this.collection.fetch({
                success: function(model, response, options) {
                    self.createMessage(i18n.t('chat.connect'));
                }
            });
            return this;
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
                attach: this.attach.toJSON()
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
            this.attach.create();
        },
        doReset: function() {
            this.attach.reset();
            this.$Input.html('');
            this.$FileBtn.hide();
            this.$AttachBtn.show();
        },
        doDownload: function(e) {
            return _.isHttpStatusOK(e.currentTarget.href);
        }
    });
    return View;
});