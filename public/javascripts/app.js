// 
// Global initialize
// 
$(document).ready(function() {
    profile.login();
    //$(window).on('hashchange', function() {
    //    doNavigate();
    //});
});
$.extend($.fn.window.defaults, {
    onMove: function(left, top) {
        if(left < 0) {
            $(this).window('move', {
                left: 0
            });;
        }
        if(top < 0) {
            $(this).window('move', {
                top: 0
            });;
        }
    }
});
$.fn.datebox.defaults.parser = function(s) {
    if(!s) return new Date();
    var ss = s.split('.');
    var d = parseInt(ss[0], 10);
    var m = parseInt(ss[1], 10);
    var y = parseInt(ss[2], 10);
    if(!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d);
    } else {
        return new Date();
    }
};
$.fn.datebox.defaults.formatter = function(d) {
    var y = d.getFullYear();
    var m = ("00" + (d.getMonth() + 1)).slice(-2);
    var d = ("00" + d.getDate()).slice(-2);
    return d + '.' + m + '.' + y;
}
$.extend($.fn.panel.defaults, {
    loadingMessage: "Загрузка..."
});
// 
// Global functions
// 

function doNavigate(hash) {
    if(!hash) hash = location.hash;
    switch(hash) {
        case '#login':
            console.log('#login');
            location.hash = hash;
            loadContent('#content', {
                id: 'login',
                view: '/login',
                script: '/javascripts/login.js'
            });
            break;
        case '#monitor':
            console.log('#monitor');
            location.hash = hash;
            loadContent('#content', {
                id: 'monitor',
                view: '/pages/monitor',
                script: '/javascripts/monitor.js'
            });
            break;
        case '#workspace':
            console.log('#workspace');
            location.hash = hash;
            loadContent('#content', {
                id: 'workspace',
                view: '/pages/workspace',
                script: '/javascripts/workspace.js'
            });
            break;
        default:
            if(profile.isAuth) doNavigate('#monitor');
            else doNavigate('#login');
    }
}

function loadContent(selector, params) {
    var obj = $(selector);
    // unload previous data
    var str = obj.attr('data-params')
    if(typeof str !== 'undefined') {
        var data = JSON.parse(unescape(str));
        $('head script[src="' + data.script + '"]').remove();
        eval(data.id + '.destroy()');
    }
    // inject script
    $('head').append('<script type="text/javascript" src="' + params.script + '"></script>');
    // store params
    obj.attr('data-params', escape(JSON.stringify(params)));
    // load view
    obj.panel({
        href: params.view,
        onLoad: function() {
            eval(params.id + '.init()');
        }
    });
}
// 
// Global classes
// 
var profile = new Profile();

function Profile(data) {
    this.user = data;
    this.login = function() {
        var self = this;
        $.getJSON("/profile", function(data) {
            self.user = data;
        }).done(function() {
            doNavigate();
        }).fail(function() {
            doNavigate('#login');
        });
    }
    this.logout = function() {
        var self = this;
        $.ajax("/profile/logout").done(function() {
            self.user = null;
            window.location.replace("/");
        }).fail(function() {
            console.log("logout fail");
        });
    }
    this.isAuth = function() {
        return this.user ? true : false;
    }
}