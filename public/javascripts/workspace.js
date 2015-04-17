app.workspace = {
    init: function() {
        var timeFormat = function(d, utc) {
            if(utc) return("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
            else return("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2);
        }
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
        this.timers = [t1, t2];
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        app.chat.destroy();
        delete app.workspace;
    },
    openVideoWindow: function() {
        $('#window-video').window('open');
    },
    openDesktopWindow: function() {
        $('#window-desktop').window('open');
    },
    openChatWindow: function() {
        $('#window-chat').window('open');
    },
    openProtocolWindow: function() {
        $('#window-protocol').window('open');
    },
    openNotesWindow: function() {
        $('#window-notes').window('open');
    },
    showStudentInfo: function() {
        $('#student-info').dialog('open');
    },
    showExamInfo: function() {
        $('#exam-info').dialog('open');
    },
    stopExam: function() {
        $.messager.confirm('Прервать', 'Прервать текущий экзамен?', function(r) {
            if(r) {
                console.log('exam stop');
                app.doNavigate('#monitor');
            }
        });
    },
    applyExam: function() {
        $.messager.confirm('Подписать', 'Подписать текущий экзамен?', function(r) {
            if(r) {
                console.log('exam apply');
                app.doNavigate('#monitor');
            }
        });
    }
}
app.chat = {
    init: function() {
        $('#chat-input').keyup(function(e) {
            if(e.keyCode == 13) {
                app.chat.doSend();
            }
        });
        $('#chat-attach').change(function() {
            var val = $(this).val();
            var filename = val.split(/(\\|\/)/g).pop();
            var str = ' <a href="#">' + filename + '</a> ';
            $('#chat-input').append(str);
        });
    },
    destroy: function() {
        delete app.chat;
    },
    doAttach: function() {
        document.getElementById('chat-attach').click();
    },
    doSend: function() {
        var timeFormat = function(d, utc) {
            if(utc) return("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
            else return("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2);
        }
        var str = $('#chat-input').text();
        if(str.length == 0) return;
        var text = '<div><span style="color:red">[' + timeFormat(new Date()) + '] Я:</span> ' + str + '</div>';
        $('#chat-output').append(text);
        $('#chat-input').html('');
        var wtf = $('#chat-output');
        var height = wtf[0].scrollHeight;
        wtf.scrollTop(height);
    }
}