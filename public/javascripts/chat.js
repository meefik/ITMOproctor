var chat = new Chat();

function Chat() {
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

    function timeFormat(d, utc) {
        if(utc) return("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
        else return("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2);
    }
}