//
// Demo view
//
define([
    "i18n",
    "text!templates/demo.html",
    "views/webcam",
    "views/screen"
], function(i18n, template, WebcamView, ScreenView) {
    console.log('views/demo.js');
    var View = Backbone.View.extend({
        events: {
            "click .play-btn": "doPlay",
            "click .stop-btn": "doStop",
            "click .networkcheck-btn": "doNetworkCheck"
        },
        initialize: function() {
            // Templates
            this.templates = _.parseTemplate(template);
            // Buffer
            this.buffer = this.generateBuffer();
            this.render();
        },
        destroy: function() {
            this.stop();
            this.remove();
        },
        stop: function() {
            for (var v in this.view) {
                if (this.view[v]) this.view[v].destroy();
            }
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            var dialog = $(this.el).dialog({
                title: i18n.t('demo.title'),
                width: 500,
                height: 480,
                closed: true,
                modal: true,
                content: tpl(data),
                onOpen: function() {
                    $(this).dialog('center');
                    self.view = {
                        webcam: new WebcamView({
                            examId: 'loopback',
                            userId: app.profile.get('_id')
                        }),
                        screen: new ScreenView({
                            examId: 'loopback',
                            userId: app.profile.get('_id')
                        })
                    };
                    $(this).find('.panel-webcam').html(self.view.webcam.render().el);
                    $(this).find('.panel-screen').html(self.view.screen.render().el);
                },
                onClose: function() {
                    self.stop();
                }
            });
            this.$Dialog = $(dialog);
            this.$Tabs = this.$('.easyui-tabs');
            this.$Network = this.$('.panel-network');
            return this;
        },
        doOpen: function() {
            this.$Dialog.dialog('open');
        },
        doClose: function() {
            this.$Dialog.dialog('close');
        },
        getCurrentTab: function() {
            var tab = this.$Tabs.tabs('getSelected');
            var index = this.$Tabs.tabs('getTabIndex', tab);
            return index;
        },
        doPlay: function() {
            switch (this.getCurrentTab()) {
                case 0:
                    this.view.webcam.play(app.profile.get('_id'));
                    break;
                case 1:
                    this.view.screen.play(app.profile.get('_id'));
                    break;
            }
        },
        doStop: function() {
            switch (this.getCurrentTab()) {
                case 0:
                    this.view.webcam.stop();
                    break;
                case 1:
                    this.view.screen.stop();
                    break;
            }
        },
        generateBuffer: function() {
            // Generate 1 MB buffer
            var buffer = 'x';
            for (var i = 0; i < 20; i++) {
                buffer += buffer;
            }
            return buffer;
        },
        doNetworkCheck: function() {
            var self = this;
            var report = {
                i18n: i18n,
                ip: "-",
                country: "-",
                city: "-",
                ping: "-",
                tx: "-",
                rx: "-",
                init: function() {
                    self.$Network.html(i18n.t('loading'));
                    report.doIP();
                    report.doPing(function() {
                        report.doRX();
                        report.doTX();
                    });
                },
                render: function() {
                    var tpl = _.template(self.templates['network-tpl']);
                    self.$Network.html(tpl(report));
                },
                doIP: function() {
                    $.ajax({
                        url: 'tools/ip'
                    }).done(function(data) {
                        report.ip = data.ip;
                        if (data.country) report.country = data.country;
                        if (data.city) report.city = data.city;
                        report.render();
                    });
                },
                doPing: function(callback) {
                    var timestamp;
                    $.ajax({
                        url: 'tools/ping',
                        cache: false,
                        beforeSend: function() {
                            timestamp = Date.now();
                        }
                    }).done(function() {
                        var diff = Date.now() - timestamp;
                        report.ping = parseInt(diff, 10);
                        report.render();
                        if (callback) callback();
                    });
                },
                doRX: function() {
                    var timestamp;
                    $.ajax({
                        type: 'post',
                        url: 'tools/rx',
                        beforeSend: function(xhr) {
                            timestamp = Date.now();
                        }
                    }).done(function() {
                        var diff = Date.now() - timestamp - report.ping;
                        if (diff > 0) {
                            var mbps = 1000 * 8 / diff;
                            report.rx = mbps.toFixed(2);
                            report.render();
                        }
                    });
                },
                doTX: function() {
                    var timestamp;
                    $.ajax({
                        type: 'post',
                        url: 'tools/tx',
                        data: self.buffer,
                        contentType: false,
                        processData: false,
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                            timestamp = Date.now();
                        }
                    }).done(function() {
                        var diff = Date.now() - timestamp - report.ping;
                        if (diff > 0) {
                            var mbps = 1000 * 8 / diff;
                            report.tx = mbps.toFixed(2);
                            report.render();
                        }
                    });
                }
            };
            report.init();
        }
    });
    return View;
});