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
// 
// Global functions
// 

function showContent(selector, url) {
    //$('#content').panel('open').panel('refresh', url);
    var obj = $(selector);
    var id = obj.attr('data-content');
    var script = '/javascripts/' + id + '.js';
    if(typeof id !== 'undefined') {
        $('head script[src="' + script + '"]').remove();
        eval('id = null');
        eval('delete '+id);
    }
    id = url.replace(/^.*[\\\/]/, '');
    script = '/javascripts/' + id + '.js';
    $('head').append('<script type="text/javascript" src="' + script + '"></script>');
    obj.attr('data-content', id);
    obj.panel({
        href: url,
        onLoad: function() {
            eval(id + '.init()');
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
            showContent('#content', '/pages/monitor');
        }).fail(function() {
            showContent('#content', '/login');
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