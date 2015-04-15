var workspace = new Workspace();
var chat = new Chat();

function Workspace() {
    var timers = [];
    this.init = function() {
        var timer = 0;
        var t1 = setInterval(function() {
            timer++;
            var d = new Date(timer * 1000);
            $('#timer-widget').text(timeFormat(d, true));
        }, 1000);
        var t2 = setInterval(function() {
            var d = new Date();
            $('#time-widget').text(timeFormat(d));
        }, 1000);
        timers = [t1, t2];
    }
    this.destroy = function() {
        timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        delete window.workspace;
        delete window.Workspace;
    }
    this.openVideoWindow = function() {
        $('#window-video').window('open');
    }
    this.openDesktopWindow = function() {
        $('#window-desktop').window('open');
    }
    this.openChatWindow = function() {
        $('#window-chat').window('open');
    }
    this.openProtocolWindow = function() {
        $('#window-protocol').window('open');
    }
    this.openNotesWindow = function() {
        $('#window-notes').window('open');
    }
    this.openUserProfileWindow = function() {
        $('#user-profile').window('open');
    }
    this.openExamProfileWindow = function() {
        $('#exam-profile').window('open');
    }
    this.confirmExamStop = function() {
        $.messager.confirm('Прервать', 'Прервать текущий экзамен?', function(r) {
            if(r) {
                console.log('exam stop');
            }
        });
    }
    this.confirmExamApply = function() {
        $.messager.confirm('Подписать', 'Подписать текущий экзамен?', function(r) {
            if(r) {
                console.log('exam apply');
            }
        });
    }

    function timeFormat(d, utc) {
        if(utc) return("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
        else return("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2);
    }

    function dateFormat(d, utc) {
        if(utc) return(d.getUTCDay() + "." + d.getUTCMonth() + "." + d.getYear());
        else return(d.getDay() + "." + d.getMonth() + "." + d.getYear());
    }
}

function Chat() {
    this.init = function() {
        var self = this;
        $('#chat-input').bind("enterKey", function(e) {
            self.doSend();
        });
        $('#chat-input').keyup(function(e) {
            if(e.keyCode == 13) {
                $(this).trigger("enterKey");
            }
        });
        $('#chat-attach').change(function() {
            var val = $(this).val();
            var filename = val.split(/(\\|\/)/g).pop();
            var str = ' <a href="#">' + filename + '</a> ';
            $('#chat-input').append(str);
        });
    }
    this.destroy = function() {
        delete window.chat;
        delete window.Chat;
    }
    this.doAttach = function() {
        document.getElementById('chat-attach').click();
    }
    this.doSend = function() {
        var str = $('#chat-input').text();
        if(str.length == 0) return;
        var text = '<div><span style="color:red">[' + timeFormat(new Date()) + '] Я:</span> ' + str + '</div>';
        $('#chat-output').append(text);
        $('#chat-input').html('');
        var wtf = $('#chat-output');
        var height = wtf[0].scrollHeight;
        wtf.scrollTop(height);
    }

    function timeFormat(d, utc) {
        if(utc) return("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
        else return("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2);
    }
}