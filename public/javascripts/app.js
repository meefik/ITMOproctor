var profile = null;
$(document).ready(function() {
    login();
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

function showContent(url) {
    $('#content').panel('open').panel('refresh', url);
}

function login() {
    $.getJSON("/profile", function(data) {
        profile = data;
    }).done(function() {
        showContent('/pages/main');
    }).fail(function() {
        showContent('/login');
    });
}

function logout() {
    $.ajax("/profile/logout").done(function() {
        window.location.replace("/");
    }).fail(function() {
        console.log("logout fail");
    });
}