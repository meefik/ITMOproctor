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
        var self = this;
        $('#chat-input').keyup(function(e) {
            if(e.keyCode == 13) {
                app.chat.doSend();
            }
        });
        $('#chat-attach').change(function() {
            var data = new FormData();
            var files = $(this)[0].files;
            if(files.length == 0) {
                app.chat.doReset();
                return;
            }
            $.each(files, function(key, value) {
                data.append(key, value);
            });
            self.filename = files['0'].name;
            $("#chat-file").fadeIn();
            var trancateFile = function(filename, length) {
                var extension = filename.indexOf('.') > -1 ? filename.split('.').pop() : '';
                if(filename.length > length) {
                    filename = filename.substring(0, length) + '...' + extension;
                }
                return filename;
            }
            $("#chat-file-progress").progressbar({
                value: 0,
                text: trancateFile(self.filename, 15)
            });
            $.ajax({
                type: 'post',
                url: '/api/upload',
                data: data,
                xhrFields: {
                    onprogress: function(progress) {
                        var percentage = Math.floor((progress.loaded / progress.total) * 100);
                        $('#chat-file-progress').progressbar('setValue', percentage);
                    }
                },
                processData: false,
                contentType: false
            }).done(function(data) {
                console.log(data["error"]);
            });
        });
    },
    destroy: function() {
        delete app.chat;
    },
    doAttach: function() {
        document.getElementById('chat-attach').click();
    },
    doReset: function() {
        this.filename = null;
        $("#chat-file").fadeOut();
        $("#chat-form").trigger('reset');
    },
    doSend: function() {
        var str = $('#chat-input').text();
        if(str.length > 0) {
            var text = '<div><span style="color:red">[' + moment().format('HH:mm:ss') + '] Я:</span> ' + str + '</div>';
        }
        if (this.filename) {
            var link = '<div><span style="color:blue">Файл:</span> <a href="#">' + this.filename + '</a></div>';
            this.doReset();
        }
        $('#chat-output').append(text);
        $('#chat-output').append(link);
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
                $("#notes-grid").datagrid('appendRow', {
                    noteId: data.noteId,
                    noteTime: data.noteTime,
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
                    var timeStr = moment(row.noteTime).format('LLL');
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
    },
    formatTime: function(val, row) {
        var noteTime = moment(val).format('HH:mm:ss');
        return noteTime;
    }
}