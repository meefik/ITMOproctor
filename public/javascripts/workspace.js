app.workspace = {
    init: function() {
        var maximizeWidget = function(container, pobj) {
            var p = pobj.panel('panel');
            p.appendTo(container).css({
                position: 'absolute',
                width: container.width(),
                height: container.height()
            });
            pobj.panel('resize');
        }
        var restoreWidget = function(container, pobj) {
            var p = pobj.panel('panel');
            p.appendTo(container).css({
                position: '',
                width: container.width(),
                height: container.height()
            });
            pobj.panel('resize');
        }
        var timer = 0;
        var t1 = setInterval(function() {
            timer++;
            var d = new Date(timer * 1000);
            $('#timer-widget').text(moment(d).utc().format('HH:mm:ss'));
        }, 1000);
        var t2 = setInterval(function() {
            $('#time-widget').text(moment().format('HH:mm:ss'));
        }, 1000);
        $(".ws-widget").each(function(index) {
            var ws = $('#ws-content');
            var container = $(this);
            var widget = container.find('.easyui-panel');
            widget.panel({
                onMaximize: function() {
                    maximizeWidget(ws, widget);
                },
                onRestore: function() {
                    restoreWidget(container, widget);
                }
            });
        });
        this.timers = [t1, t2];
        app.chat.init();
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        app.chat.destroy();
        delete app.workspace;
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
        var str = $('#chat-input').text();
        if(str.length == 0) return;
        var text = '<div><span style="color:red">[' + moment().format('HH:mm:ss') + '] Я:</span> ' + str + '</div>';
        $('#chat-output').append(text);
        $('#chat-input').html('');
        var wtf = $('#chat-output');
        var height = wtf[0].scrollHeight;
        wtf.scrollTop(height);
    }
}
app.notes = {
    init: function() {
        //$("#notes-grid").datagrid({url:'/api/notes',method:'get'});
    },
    add: function() {
        var addNote = function() {
            var noteText = $("#note-form input[name='noteText']").val();
            $.ajax({
                method: "POST",
                url: "/api/notes",
                data: {
                    noteText: noteText
                }
            }).done(function(data) {
                var noteTime = moment(data.noteTime).format('DD.MM.YYYY HH:mm:ss');
                $("#notes-grid").datagrid('appendRow', {
                    noteId: data.noteId,
                    noteTime: noteTime,
                    noteText: noteText
                });
                app.notes.close();
                var rows = $("#notes-grid").datagrid('getRows').length;
                $("#notes-grid").datagrid('scrollTo', rows - 1);
            });
        }
        $("#note-dialog").dialog({
            title: 'Добавление заметки',
            buttons: [{
                text: 'Сохранить',
                iconCls: 'fa fa-check',
                handler: addNote
            }, {
                text: 'Отменить',
                iconCls: 'fa fa-times',
                handler: app.notes.close
            }],
            onOpen: function() {
                moment.locale('ru');
                var timeStr = moment().format('LLL');
                $('#note-date').text(timeStr);
            }
        });
        $("#note-dialog").dialog('open');
    },
    edit: function() {
        var row = $("#notes-grid").datagrid('getSelected');
        var idx = $("#notes-grid").datagrid('getRowIndex', row);
        if(idx > -1) {
            var updateNote = function() {
                //var noteTime = $("#note-form input[name='noteTime']").val();
                var noteText = $("#note-form input[name='noteText']").val();
                $.ajax({
                    method: "PUT",
                    url: "/api/notes/" + row.noteId,
                    data: {
                        noteText: noteText
                    }
                }).done(function(data) {
                    $("#notes-grid").datagrid('updateRow', {
                        index: idx,
                        row: {
                            noteText: noteText
                        }
                    });
                    app.notes.close();
                });
            }
            $("#note-dialog").dialog({
                title: 'Редактирование заметки',
                buttons: [{
                    text: 'Сохранить',
                    iconCls: 'fa fa-check',
                    handler: updateNote
                }, {
                    text: 'Отменить',
                    iconCls: 'fa fa-times',
                    handler: app.notes.close
                }],
                onOpen: function() {
                    moment.locale('ru');
                    var timeStr = moment(row.noteTime, 'DD.MM.YYYY HH:mm:ss').format('LLL');
                    $('#note-date').text(timeStr);
                }
            });
            $("#note-form").form('load', row);
            $("#note-dialog").dialog('open');
        }
    },
    delete: function() {
        var row = $("#notes-grid").datagrid('getSelected');
        var idx = $("#notes-grid").datagrid('getRowIndex', row);
        if(idx > -1) {
            $.messager.confirm('Подтверждение', 'Вы действительно хотите удалить выбранную заметку?', function(r) {
                if(r) {
                    $("#notes-grid").datagrid('deleteRow', idx);
                }
            });
        }
    },
    close: function() {
        $("#note-form").form('reset');
        $('#note-dialog').dialog('close');
    }
}