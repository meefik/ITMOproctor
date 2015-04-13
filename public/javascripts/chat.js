$(document).ready(function() {
    $('#chat-input').bind("enterKey", function(e) {
        chatSend();
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
});

function chatAttachFile() {
    document.getElementById('chat-attach').click();
}

function chatSend() {
    var str = $('#chat-input').text();
    if (str.length == 0) return;
    var text = '<div><span style="color:red">['+timeFormat(new Date())+'] Я:</span> ' + str + '</div>';
    $('#chat-output').append(text);
    $('#chat-input').html('');
    var wtf = $('#chat-output');
    var height = wtf[0].scrollHeight;
    wtf.scrollTop(height);
}