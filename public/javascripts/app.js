//
// Global variables
//
var LANG = 'ru';
var SINGLE_MODE = false;
var UPLOAD_LIMIT = 10; // MB
var TX_MIN = 1; // Mbps
var RX_MIN = 1; // Mbps
var REQUEST_INTERVAL = 60; // seconds

//
// Loading progress
//
$.messager.progress({
    onClose: function() {}
});

//
// RequireJS config
//
require.config({
    config: {
        replace: {
            pattern: "LANG",
            value: function() {
                return LANG;
            }
        }
    },
    paths: {
        replace: '../bower_components/require.replace/require.replace',
        text: '../bower_components/text/text',
        locale: 'locales/LANG',
        easyui: '../bower_components/jeasyui/locale/easyui-lang-LANG'
    },
    shim: {
        'easyui': {
            exports: '$'
        }
    }
});

//
// Backbone config
//
Backbone.Model.prototype.idAttribute = '_id';

//
// Underscore extends
//
_.mixin({
    parseTemplate: function(template) {
        var $div = $('<div></div>').html(template);
        var templates = {};
        var scripts = $div.find('script[type="text/template"]');
        for (var i = 0, l = scripts.length; i < l; i++) {
            var id = scripts[i].id;
            templates[id] = $(scripts[i]).html();
        }
        return templates;
    },
    postMessage: function(message, targetOrigin, transfer) {
        var win = window.win || window;
        win.window.postMessage(message, targetOrigin, transfer);
    },
    truncateFilename: function(filename, length) {
        var extension = filename.indexOf('.') > -1 ? filename.split('.').pop() : '';
        if (filename.length > length) {
            filename = filename.substring(0, length - extension.length) + '...' + extension;
        }
        return filename;
    },
    isHttpStatusOK: function(url) {
        var status;
        $.ajax({
            url: url,
            type: 'HEAD',
            async: false,
            error: function() {
                status = false;
            },
            success: function() {
                status = true;
            }
        });
        return status;
    }
});

//
// jQuery extends 
//
$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        }
        else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};
$.extend($.fn.progressbar.methods, {
    setColor: function(jq, color) {
        var pb = jq.find('.progressbar-value > .progressbar-text');
        var defaultColor = $.data(jq[0], 'progressbar').options.color;
        if (!defaultColor) {
            defaultColor = pb.css('backgroundColor');
            $.data(jq[0], 'progressbar').options.color = defaultColor;
        }
        if (color) {
            pb.css({
                backgroundColor: color
            });
        }
        else {
            pb.css({
                backgroundColor: defaultColor
            });
        }
    }
});

//
// Application
//
require([
    "router",
    "models/profile",
    "models/time",
    "collections/settings"
], function(Router, ProfileModel, TimeModel, SettingsCollection) {
    console.log('app.js');
    // app
    window.app = {
        profile: new ProfileModel(),
        time: new TimeModel(),
        settings: new SettingsCollection(),
        router: new Router(),
        login: function(username, password, error) {
            var self = this;
            this.profile.clear().save({
                username: username,
                password: password
            }, {
                success: function() {
                    self.time.syncTime();
                    self.connect();
                    self.router.navigate("", {
                        trigger: true
                    });
                },
                error: error
            });
        },
        logout: function(options) {
            var self = this;
            _.postMessage('clearCookies', '*');
            this.profile.destroy({
                success: function(model) {
                    model.clear();
                    self.time.stop();
                    self.disconnect();
                    self.router.navigate("login", {
                        trigger: true
                    });
                }
            });
        },
        connect: function(options) {
            if (this.io) return;
            var url = window.location.host;
            this.io = {
                notify: io.connect(url + '/notify', options),
                call: io.connect(url + '/call', options),
                screen: io.connect(url + '/screen', options)
            };
        },
        disconnect: function() {
            for (var k in this.io) {
                if (this.io[k]) this.io[k].disconnect();
            }
            this.io = null;
        },
        isAuth: function() {
            return this.profile.has("username");
        },
        isMe: function(id) {
            return this.profile.get('_id') === id;
        },
        now: function() {
            return this.time.now();
        }
    };
    // starting
    $(document).ready(function() {
        console.log('ready');
        if (app.isAuth()) {
            app.time.syncTime();
            app.connect();
        }
        Backbone.history.start();
    });
});