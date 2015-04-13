$(document).ready(function() {
    var timer = 0;
    setInterval(function() {
        timer++;
        var d = new Date(timer * 1000);
        $('#timer-widget').text(timeFormat(d, true));
    }, 1000);
    setInterval(function() {
        var d = new Date();
        $('#time-widget').text(timeFormat(d));
    }, 1000);
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
        return new Date(y, m-1, d);
    } else {
        return new Date();
    }
};
$.fn.datebox.defaults.formatter = function(d) {
    var y = d.getFullYear();
    var m = ("00" + (d.getMonth()+1)).slice(-2);
    var d = ("00" + d.getDate()).slice(-2);
    return d + '.' + m + '.' + y;
}

function timeFormat(d, utc) {
    if(utc) return("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
    else return("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2);
}

function dateFormat(d, utc) {
    if(utc) return(d.getUTCDay() + "." + d.getUTCMonth() + "." + d.getYear());
    else return(d.getDay() + "." + d.getMonth() + "." + d.getYear());
}

function openVideoWindow() {
    $('#window-video').window('open');
}

function openDesktopWindow() {
    $('#window-desktop').window('open');
}

function openChatWindow() {
    $('#window-chat').window('open');
}

function openProtocolWindow() {
    $('#window-protocol').window('open');
}

function openNotesWindow() {
    $('#window-notes').window('open');
}

function openUserProfileWindow() {
    $('#user-profile').window('open');
}

function openExamProfileWindow() {
    $('#exam-profile').window('open');
}

function confirmExamStop() {
    $.messager.confirm('Прервать', 'Прервать текущий экзамен?', function(r) {
        if(r) {
            console.log('exam stop');
        }
    });
}

function confirmExamApply() {
    $.messager.confirm('Подписать', 'Подписать текущий экзамен?', function(r) {
        if(r) {
            console.log('exam apply');
        }
    });
}