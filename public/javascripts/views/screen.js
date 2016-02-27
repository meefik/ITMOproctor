//
// Webcam view
//
define([
    "i18n",
    "text!templates/screen.html",
    "models/webcall"
], function(i18n, template, WebcallModel) {
    console.log('views/screen.js');
    var View = Backbone.View.extend({
        className: "screen-view",
        initialize: function(options) {
            this.options = options || {};
            this.templates = _.parseTemplate(template);
            this.webcall = new WebcallModel({
                userid: "screen-" + this.options.examId + "-" + this.options.userId,
                constraints: this.constraints.bind(this)
            });
        },
        destroy: function() {
            if (this.webcall) this.webcall.destroy();
            this.remove();
        },
        render: function() {
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            this.$VideoInput = this.$(".screen-input");
            this.$VideoOutput = this.$(".screen-output");
            this.videoOutput = this.$VideoOutput.get(0);
            if (this.options.capture) {
                this.videoInput = this.$VideoInput.get(0);
                this.$VideoInput.draggable({
                    onDrag: function(e) {
                        var d = e.data;
                        var parent = $(d.parent);
                        var target = $(d.target);
                        if (d.left < 0) {
                            d.left = 0;
                        }
                        if (d.top < 0) {
                            d.top = 0;
                        }
                        if (d.left + target.outerWidth() > parent.width()) {
                            d.left = parent.width() - target.outerWidth();
                        }
                        if (d.top + target.outerHeight() > parent.height()) {
                            d.top = parent.height() - target.outerHeight();
                        }
                    }
                });
            }
            this.webcall.set({
                input: this.videoInput,
                output: this.videoOutput
            });
            return this;
        },
        toolbar: function(model) {
            var self = this;
            this.$el.panel({
                tools: [{
                    iconCls: 'fa fa-play',
                    handler: function() {
                        var student = model.get('student') || {};
                        self.play(student._id);
                    }
                }, {
                    iconCls: 'fa fa-pause',
                    handler: function() {
                        self.stop();
                    }
                }]
            });
        },
        constraints: function() {
            var constraints = {
                audio: false,
                video: true
            };
            if (this.options.capture) {
                app.settings.refresh();
                var resolution = app.settings.get('screen-resolution');
                resolution = resolution ? resolution.get('value').split('x') : [1280, 720];
                var fps = app.settings.get('screen-fps');
                fps = fps ? fps.get('value') : 15;
                var sourceId = app.settings.get('screen-id');
                sourceId = sourceId ? sourceId.get('value') : 'screen:0';
                constraints.video = {
                    mandatory: {
                        maxWidth: resolution[0],
                        maxHeight: resolution[1],
                        maxFrameRate: fps,
                        minFrameRate: 1,
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId
                    }
                };
            }
            return constraints;
        },
        play: function(userId) {
            var peer = "screen-" + this.options.examId + "-" + userId;
            this.webcall.call(peer);
        },
        stop: function() {
            this.webcall.stop();
        }
    });
    return View;
});