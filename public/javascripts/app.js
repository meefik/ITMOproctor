// 
// Global initialize
// 
$(document).ready(function() {
    app.profile();
});
// 
// Application object
// 
var app = {
    user: null,
    profile: function() {
        var self = this;
        $.getJSON("/profile", function(data) {
            self.user = data;
        }).done(function() {
            self.doNavigate();
        }).fail(function() {
            self.doNavigate('#login');
        });
    },
    logout: function() {
        var self = this;
        $.ajax("/profile/logout").done(function() {
            self.user = null;
            window.location.replace("/");
        }).fail(function() {
            console.log("logout fail");
        });
    },
    isAuth: function() {
        return this.user ? true : false;
    },
    doNavigate: function(hash) {
        if(!hash) hash = location.hash;
        switch(hash) {
            case '#login':
                console.log('#login');
                location.hash = hash;
                this.loadContent('#content', {
                    id: 'app.login',
                    view: '/login',
                    script: '/javascripts/login.js'
                });
                break;
            case '#monitor':
                console.log('#monitor');
                location.hash = hash;
                this.loadContent('#content', {
                    id: 'app.monitor',
                    view: '/pages/monitor',
                    script: '/javascripts/monitor.js'
                });
                break;
            case '#workspace':
                console.log('#workspace');
                location.hash = hash;
                this.loadContent('#content', {
                    id: 'app.workspace',
                    view: '/pages/workspace',
                    script: '/javascripts/workspace.js'
                });
                break;
            default:
                if(this.isAuth) this.doNavigate('#monitor');
                else this.doNavigate('#login');
        }
    },
    loadContent: function(selector, params) {
        var obj = $(selector);
        // unload previous data
        var str = obj.attr('data-params')
        if(typeof str !== 'undefined') {
            var data = JSON.parse(unescape(str));
            if(data.script) {
                $('head script[src="' + data.script + '"]').remove();
                if(data.id) eval(data.id + '.destroy()');
            }
        }
        // inject script
        if(params.script) {
            $('head').append('<script type="text/javascript" src="' + params.script + '"></script>');
        }
        // store params
        obj.attr('data-params', escape(JSON.stringify(params)));
        // load view
        if(params.view) {
            obj.panel({
                href: params.view,
                onLoad: function() {
                    if(params.id) eval(params.id + '.init()');
                }
            });
        }
    }
}