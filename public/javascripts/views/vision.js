//
// Vision view
//
define([
    "i18n",
    "text!templates/vision.html",
    "views/settings",
    "views/exam",
    "views/passport",
    "views/profile",
    "views/verify",
    "views/members",
    "views/notes",
    "views/chat",
    "views/webcam",
    "views/screen",
    "collections/attach"
], function(i18n, template, SettingsView, ExamView, PassportView, ProfileView, VerifyView, MembersView, NotesView, ChatView, WebcamView, ScreenView, AttachCollection) {
    console.log('views/vision.js');
    var View = Backbone.View.extend({
        events: {
            "click .verify-btn": "doVerify",
            "click .screenshot-btn": "doScreenshot",
            "click .exam-stop-btn": "rejectExam",
            "click .exam-apply-btn": "applyExam"
        },
        bindings: {
            '.exam-subject': {
                observe: 'subject'
            },
            '.server-time': {
                observe: 'time',
                onGet: function(val) {
                    return moment(val).format('HH:mm:ss');
                }
            },
            '.duration-time': {
                observe: 'time',
                onGet: function(val) {
                    var out = '0.00:00:00';
                    var now = app.now();
                    var startDate = this.exam.get('startDate');
                    if (startDate) {
                        var diff = now.diff(startDate);
                        if (diff < 0) diff = 0;
                        out = moment(diff).utc().format('HH:mm:ss');
                    }
                    var endDate = this.exam.get('endDate');
                    if (endDate && this.$DurationWidget) {
                        if (moment(endDate).diff(now, 'minutes') <= 5)
                            this.$DurationWidget.css('color', 'red');
                        else if (moment(endDate).diff(now, 'minutes') <= 15)
                            this.$DurationWidget.css('color', 'orange');
                    }
                    return out;
                }
            }
        },
        initialize: function(options) {
            // Variables
            var self = this;
            this.options = options || {};
            this.protectionCode = null;
            this.automuteFlag = false;
            // Templates
            this.templates = _.parseTemplate(template);
            // Exam model
            var Exam = Backbone.Model.extend({
                urlRoot: 'inspector/exam'
            });
            this.exam = new Exam({
                _id: this.options.examId
            });
            //this.listenTo(this.exam, 'change', this.render);
            // Sub views
            this.view = {
                settings: new SettingsView(),
                profile: new ProfileView(),
                passport: new PassportView(),
                exam: new ExamView(),
                verify: new VerifyView(),
                notes: new NotesView({
                    examId: this.options.examId
                }),
                chat: new ChatView({
                    examId: this.options.examId
                }),
                members: new MembersView({
                    examId: this.options.examId
                }),
                webcam: new WebcamView({
                    examId: this.options.examId,
                    userId: app.profile.get('_id')
                }),
                screen: new ScreenView({
                    examId: this.options.examId,
                    userId: app.profile.get('_id'),
                    capture: false
                })
            };
            // Window events
            this.messageEventHandler = function(event) {
                var message = event.data;
                switch (message.id) {
                    case 'screenshot':
                        self.screenshotDlg(message.data);
                        break;
                }
            };
            this.focusEventHandler = function(event) {
                self.view.webcam.mute(false);
            };
            this.blurEventHandler = function(event) {
                self.view.webcam.mute(true);
            };
            window.addEventListener('message', this.messageEventHandler);
            // Socket events
            this.connectHandler = function(data) {
                self.$NetworkWidget.html(i18n.t('vision.online'));
                self.$NetworkWidget.css('color', 'green');
            };
            this.disconnectHandler = function(data) {
                self.$NetworkWidget.html(i18n.t('vision.offline'));
                self.$NetworkWidget.css('color', 'red');
            };
            app.io.notify.on('connect', this.connectHandler);
            app.io.notify.on('disconnect', this.disconnectHandler);
            // Timers
            var t1 = setInterval(function() {
                var student = self.exam.get('student');
                if (student && student.provider) {
                    self.getExamStatus();
                }
            }, REQUEST_INTERVAL * 1000);
            this.timers = [t1];
            // Start exam
            this.exam.fetch();
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
            // Veiws
            this.view.members.setElement(this.$('.panel-members'));
            this.view.notes.setElement(this.$('.panel-notes'));
            this.view.chat.setElement(this.$('.panel-chat'));
            this.view.webcam.setElement(this.$('.panel-webcam'));
            this.view.screen.setElement(this.$('.panel-screen'));
            // Render panels
            this.view.members.render();
            this.view.notes.render();
            this.view.chat.render();
            this.view.webcam.render();
            this.view.screen.render();
            this.view.webcam.toolbar(this.exam);
            this.view.screen.toolbar(this.exam);
            // jQuery selectors
            this.$Menu = $('#main-menu');
            this.$NetworkWidget = this.$('.network-widget');
            this.$DurationWidget = this.$('.duration-time');
            this.$DialogScreenshot = $("#screenshot-dlg");
            this.$ScreenshotPreview = this.$DialogScreenshot.find('img');
            this.$ScreenshotComment = this.$DialogScreenshot.find('.screenshot-comment');
            this.$DialogConfirm = $("#exam-confirm-dlg");
            this.$ConfirmMessage = this.$DialogConfirm.find('.confirm-message');
            this.$ProtectionCode = this.$DialogConfirm.find('.protection-code');
            this.$ProtectionCodeInput = this.$DialogConfirm.find('.protection-code-input');
            this.$ExamComment = this.$DialogConfirm.find('.exam-comment');
            this.$ApplyText = this.$DialogConfirm.find('.apply-text');
            this.$RejectText = this.$DialogConfirm.find('.reject-text');
            this.$Video = this.$('.panel-webcam > .webcam-output');
            // Event handlers
            this.$Menu.menu({
                onClick: function(item) {
                    switch (item.name) {
                        case "exam":
                            self.view.exam.doOpen(self.options.examId);
                            break;
                        case "passport":
                            var student = self.exam.get('student');
                            if (student) self.view.passport.doOpen(student._id);
                            break;
                        case "automute":
                            self.toggleAutomute(item);
                            break;
                        case "profile":
                            self.view.profile.doOpen();
                            break;
                        case "settings":
                            self.view.settings.doOpen();
                            break;
                        case "disconnect":
                            self.disconnect();
                            break;
                    }
                }
            });
            // set validate method
            $.extend($.fn.validatebox.defaults.rules, {
                protectionCode: {
                    validator: function(value, param) {
                        return value == self.protectionCode;
                    },
                    message: i18n.t('vision.submit.incorrectProtectionCode')
                }
            });
            // set protection code method
            this.$ProtectionCodeInput.validatebox({
                required: true,
                validType: 'protectionCode',
            });
            // Resize widgets
            var resizeWidget = function(container, pobj) {
                var p = pobj.panel('panel');
                p.detach().appendTo(container).css({
                    position: 'absolute',
                    top: 0,
                    left: 0
                });
                pobj.panel('resize', {
                    width: container.width(),
                    height: container.height()
                });
                pobj.find('video').each(function(index, element) {
                    if (element.src != '') {
                        element.play();
                    }
                    if (element.className == 'video-input') {
                        element.style.left = '';
                        element.style.bottom = '';
                        element.style.top = '5px';
                        element.style.right = '5px';
                    }
                });
            };
            this.$(".ws-widget").each(function(index, element) {
                var wsWidget = $(element);
                var wsContent = self.$(".ws-content");
                var wsPanel = wsWidget.find(".ws-panel");
                wsPanel.panel({
                    onMaximize: function() {
                        resizeWidget(wsContent, wsPanel);
                    },
                    onRestore: function() {
                        resizeWidget(wsWidget, wsPanel);
                    }
                });
            });
            this.stickit(app.time);
            this.stickit(this.exam);
            return this;
        },
        destroy: function() {
            this.timers.forEach(function(element, index, array) {
                clearInterval(element);
            });
            for (var v in this.view) {
                if (this.view[v]) this.view[v].destroy();
            }
            window.removeEventListener('message', this.messageEventHandler);
            window.removeEventListener('focus', this.focusEventHandler);
            window.removeEventListener('blur', this.blurEventHandler);
            app.io.notify.removeListener('connect', this.connectHandler);
            app.io.notify.removeListener('disconnect', this.disconnectHandler);
            this.remove();
        },
        toggleAutomute: function(item) {
            this.automuteFlag = !this.automuteFlag;
            if (this.automuteFlag) {
                window.addEventListener('focus', this.focusEventHandler);
                window.addEventListener('blur', this.blurEventHandler);
                this.$Menu.menu('setIcon', {
                    target: item.target,
                    iconCls: 'fa fa-dot-circle-o'
                });
            }
            else {
                window.removeEventListener('focus', this.focusEventHandler);
                window.removeEventListener('blur', this.blurEventHandler);
                this.$Menu.menu('setIcon', {
                    target: item.target,
                    iconCls: 'fa fa-circle-o'
                });
            }
        },
        getExamStatus: function() {
            var self = this;
            $.getJSON('inspector/exam/' + this.options.examId + '/status',
                function(data) {
                    if (!data) return;
                    if (!self.examStatus) self.examStatus = data.status;
                    if (data.status != self.examStatus) {
                        self.examStatus = data.status;
                        self.view.notes.collection.create({
                            time: app.now(),
                            text: i18n.t('vision.changeStatus', {
                                status: self.examStatus
                            }),
                            attach: [],
                            editable: false
                        });
                    }
                });
        },
        doVerify: function() {
            var self = this;

            function saveAttach(dataUrl, callback) {
                var blobBin = atob(dataUrl.split(',')[1]);
                var array = [];
                for (var i = 0; i < blobBin.length; i++) {
                    array.push(blobBin.charCodeAt(i));
                }
                var file = {
                    name: 'document.png',
                    blob: new Blob([new Uint8Array(array)], {
                        type: 'image/png'
                    })
                };
                var attach = new AttachCollection(null, null, function(action, args) {
                    switch (action) {
                        case 'done':
                            callback(this);
                            break;
                    }
                });
                attach.create({
                    file: file
                });
            }

            function submitData(verified, dataUrl) {
                this.exam.set('verified', verified);
                $.ajax({
                    url: "inspector/exam/" + self.exam.get('_id'),
                    type: "post",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: JSON.stringify({
                        verified: verified
                    })
                }).done(function(respond) {
                    var message = verified.submit ? i18n.t('vision.verify.success') : i18n.t('vision.verify.fail');
                    saveAttach(dataUrl, function(attach) {
                        self.view.notes.collection.create({
                            time: app.now(),
                            text: message,
                            attach: attach.toJSON(),
                            editable: false
                        });
                    });
                });
            }
            this.view.verify.doOpen(this.$Video.get(0), this.exam.get('student'), submitData.bind(this));
        },
        doScreenshot: function() {
            _.postMessage('takeScreenshot', '*');
        },
        screenshotDlg: function(dataUrl) {
            var self = this;
            var closeBtn = function() {
                self.$DialogScreenshot.dialog('close');
                self.$ScreenshotComment.textbox('setValue', '');
            };
            var saveBtn = function() {
                var blobBin = atob(dataUrl.split(',')[1]);
                var array = [];
                for (var i = 0; i < blobBin.length; i++) {
                    array.push(blobBin.charCodeAt(i));
                }
                var file = {
                    name: 'screenshot.png',
                    blob: new Blob([new Uint8Array(array)], {
                        type: 'image/png'
                    })
                };
                var attach = new AttachCollection(null, null, function(action, args) {
                    switch (action) {
                        case 'done':
                            var comment = self.$ScreenshotComment.textbox('getValue');
                            self.view.notes.collection.create({
                                time: app.now(),
                                text: comment,
                                attach: this.toJSON(),
                                editable: true
                            });
                            closeBtn();
                            break;
                    }
                });
                attach.create({
                    file: file
                });
            };
            self.$ScreenshotPreview.attr({
                src: dataUrl
            });
            self.$DialogScreenshot.dialog({
                closed: false,
                buttons: [{
                    text: i18n.t('vision.screenshot.save'),
                    iconCls: 'fa fa-check',
                    handler: saveBtn
                }, {
                    text: i18n.t('vision.screenshot.close'),
                    iconCls: 'fa fa-times',
                    handler: closeBtn
                }],
                onOpen: function() {
                    $(this).dialog('center');
                }
            });
        },
        confirmDlg: function(resolution) {
            var self = this;
            var reset = function() {
                self.generateCode();
                self.$ProtectionCode.text(self.protectionCode);
                self.$ProtectionCodeInput.val('');
                self.$ProtectionCodeInput.focus();
            };
            if (resolution) {
                this.$ConfirmMessage.html(i18n.t('vision.submit.message', {
                    resolution: '<strong style="color:green">' + i18n.t('vision.submit.true') + '</strong>'
                }));
            }
            else {
                this.$ConfirmMessage.html(i18n.t('vision.submit.message', {
                    resolution: '<strong style="color:red">' + i18n.t('vision.submit.false') + '</strong>'
                }));
            }
            this.$DialogConfirm.dialog({
                closed: false,
                buttons: [{
                    text: i18n.t('vision.submit.submitBtn'),
                    handler: function() {
                        if (self.$ProtectionCodeInput.validatebox('isValid')) {
                            // Finish exam
                            self.exam.save({
                                _id: self.options.examId,
                                resolution: resolution,
                                comment: self.$ExamComment.textbox('getValue')
                            }, {
                                success: function() {
                                    self.$DialogConfirm.dialog('close');
                                    self.disconnect();
                                }
                            });
                        }
                        else {
                            reset();
                        }
                    }
                }, {
                    text: i18n.t('vision.submit.cancelBtn'),
                    handler: function() {
                        self.$DialogConfirm.dialog('close');
                    }
                }],
                onOpen: function() {
                    reset();
                }
            });
        },
        applyExam: function() {
            this.confirmDlg(true);
        },
        rejectExam: function() {
            this.confirmDlg(false);
        },
        disconnect: function() {
            if (SINGLE_MODE) {
                app.router.navigate("monitor", {
                    trigger: true
                });
            }
            else {
                _.postMessage('closeWindow', '*');
                window.close();
            }
        },
        generateCode: function() {
            var randomizeNumber = function(min, max) {
                return Math.ceil((Math.random() * (max - min)) + min);
            };
            this.protectionCode = randomizeNumber(1000, 9999);
        }
    });
    return View;
});