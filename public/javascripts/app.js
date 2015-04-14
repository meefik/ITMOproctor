// 
// Global variables
// 
var profile = new Profile();
// 
// Global initialize
// 
$(document).ready(function() {
    profile.login();
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

function loadContent(selector, url) {
    //$('#content').panel('open').panel('refresh', url);
    var obj = $(selector);
    var page = obj.attr('data-page');
    var script = '/javascripts/' + page + '.js';
    if(typeof page !== 'undefined') {
        $('head script[src="' + script + '"]').remove();
        eval(page + '.destroy()');
    }
    page = url.replace(/^.*[\\\/]/, '');
    script = '/javascripts/' + page + '.js';
    $('head').append('<script type="text/javascript" src="' + script + '"></script>');
    obj.attr('data-page', page);
    obj.panel({
        href: url,
        onLoad: function() {
            eval(page + '.init()');
        }
    });
}
// 
// Global classes
// 

function Profile(data) {
    this.user = data;
    this.login = function() {
        var self = this;
        $.getJSON("/profile", function(data) {
            self.user = data;
        }).done(function() {
            loadContent('#content', '/pages/monitor');
        }).fail(function() {
            loadContent('#content', '/login');
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