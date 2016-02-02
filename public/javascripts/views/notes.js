//
// Notes view
//
define([
    "i18n",
    "text!templates/notes.html"
], function(i18n, template) {
    console.log('views/notes.js');
    var View = Backbone.View.extend({
        className: "notes-view",
        events: {
            "click .note-add-btn": "add",
            "click .attach-link": "doDownload"
        },
        initialize: function(options) {
            // Varialbes
            var self = this;
            this.options = options || {};
            // Templates
            this.templates = _.parseTemplate(template);
            // Single item view
            this.ItemView = Backbone.View.extend({
                tagName: "li",
                events: {
                    "click a.note-remove": "delete",
                    "click a.note-edit": "edit"
                },
                initialize: function() {
                    this.tpl = _.template(self.templates['note-item-tpl']);
                    this.$Dialog = $("#note-dlg");
                    this.$DialogForm = this.$Dialog.find("form");
                    this.$DialogTime = this.$Dialog.find(".note-time");
                    this.$DialogText = this.$Dialog.find(".note-text");
                    this.listenTo(this.model, 'change', this.render);
                    this.listenTo(this.model, 'remove', this.remove);
                    this.listenTo(this.model, 'destroy', this.remove);
                },
                render: function() {
                    this.$el.html(this.tpl({
                        i18n: i18n,
                        note: this.model.toJSON()
                    }));
                    return this;
                },
                edit: function() {
                    var self = this;
                    var updateNote = function() {
                        var noteText = self.$DialogText.textbox('getValue');
                        self.model.save({
                            text: noteText
                        }, {
                            success: function() {
                                self.close();
                            }
                        });
                    };
                    var closeDlg = function() {
                        self.close();
                    };
                    this.$Dialog.dialog({
                        title: i18n.t('notes.editorTitle'),
                        buttons: [{
                            text: i18n.t('notes.save'),
                            iconCls: 'fa fa-check',
                            handler: updateNote
                        }, {
                            text: i18n.t('notes.close'),
                            iconCls: 'fa fa-times',
                            handler: closeDlg
                        }],
                        onOpen: function() {
                            $(this).dialog('center');
                            var timeStr = moment(self.model.get('time')).format('LLL');
                            self.$DialogTime.text(timeStr);
                        }
                    });
                    this.$DialogForm.form('load', this.model.toJSON());
                    this.$Dialog.dialog('open');
                },
                close: function() {
                    this.$DialogForm.form('reset');
                    this.$Dialog.dialog('close');
                },
                delete: function() {
                    var self = this;
                    $.messager.confirm(i18n.t('notes.removeConfirm.title'),
                        i18n.t('notes.removeConfirm.message'),
                        function(r) {
                            if (r) {
                                self.model.destroy();
                            }
                        });
                }
            });
            // Notes collection
            var Notes = Backbone.Collection.extend({
                url: 'notes/' + this.options.examId,
                comparator: 'time'
            });
            this.collection = new Notes();
            this.listenTo(this.collection, 'add', this.appendItem);
            // Socket notification
            app.io.notify.on('notes-' + this.options.examId, function(data) {
                if (!app.isMe(data.userId)) {
                    self.collection.fetch();
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
            this.$Panel = this.$(".notes-panel");
            this.$List = this.$(".notes-list");
            this.$Input = this.$(".note-input");
            // DOM events
            this.$Input.textbox('textbox').bind('keypress', function(e) {
                if (e.keyCode == 13) self.add();
            });
            this.collection.fetch();
            return this;
        },
        destroy: function() {
            app.io.notify.removeListener('notes-' + this.options.examId);
            this.remove();
        },
        add: function() {
            var noteText = this.$Input.textbox('getValue');
            if (!noteText) return;
            this.collection.create({
                time: app.now(),
                text: noteText,
                attach: [],
                editable: true
            });
            this.$Input.textbox('setValue', '');
        },
        appendItem: function(model) {
            var view = new this.ItemView({
                model: model
            });
            this.$List.append(view.render().el);
            this.$Panel.scrollTop(this.$Panel[0].scrollHeight);
        },
        doDownload: function(e) {
            return _.isHttpStatusOK(e.currentTarget.href);
        }
    });
    return View;
});