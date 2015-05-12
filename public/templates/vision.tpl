<div id="vision" class="easyui-layout" data-options="fit:true">
    <div data-options="region:'north',border:false" style="margin-bottom:1px;">
        <div class="easyui-panel" style="padding:5px;height:28px;" data-options="fit:true">
            <button class="easyui-linkbutton screenshot-btn" data-options="plain:true,iconCls:'fa fa-camera'">Снимок экрана</button>
            <button class="easyui-linkbutton student-info-btn" data-options="plain:true,iconCls:'fa fa-user'" style="float:right"><span class="student-widget">...</span></button>
            <button class="easyui-linkbutton exam-info-btn" data-options="plain:true,iconCls:'fa fa-tags'" style="float:right"><span class="exam-widget">...</span></button>
        </div>
    </div>
    <div class="ws-content" data-options="region:'center',border:false">
        <div class="easyui-layout" data-options="fit:true">
            <div data-options="region:'west',border:false" style="width:30%">
                <div class="easyui-layout" data-options="fit:true">
                    <div data-options="region:'north',border:false" class="ws-widget" style="height:40%">
                        <div id="panel-video" class="easyui-panel" title="Видеокамера" data-options="fit:true,iconCls:'fa fa-video-camera',maximizable:true">&nbsp;</div>
                    </div>
                    <div data-options="region:'center',border:false" class="ws-widget">
                        <div id="panel-chat" class="easyui-panel" title="Сообщения" data-options="fit:true,iconCls:'fa fa-comments-o',maximizable:true">
                            <!-- Begin: Chat -->
                            <div class="easyui-layout" data-options="fit:true">
                                <div class="chat-panel" data-options="region:'center',border:false" style="overflow-x:hidden;word-wrap:break-word;">
                                    <ul class="chat-output" style="list-style-type:none; padding:.3em; margin:0"></ul>
                                </div>
                                <div data-options="region:'south',split:true,border:false">
                                    <div class="easyui-layout" data-options="fit:true">
                                        <div data-options="region:'north',border:false">
                                            <div class="easyui-panel" data-options="fit:true" style="padding:3px;border-left:0;border-right:0;height:28px;">
                                                <button class="easyui-linkbutton chat-file" data-options="plain:true,iconCls:'fa fa-download'" style="float:left;display:none;">
                                                    <div class="easyui-progressbar chat-progress" data-options="width:150,height:18" style="margin:3px 0 3px 0"></div>
                                                </button>
                                                <button class="easyui-linkbutton chat-send-btn" data-options="plain:true,iconCls:'fa fa-paper-plane-o'" style="float:right">Отправить</button>
                                                <button class="easyui-linkbutton chat-attach-btn" data-options="plain:true,iconCls:'fa fa-paperclip'" style="float:right">Прикрепить</button>
                                                <form method="post" enctype="multipart/form-data" style="display:none;">
                                                    <input type="file" name="chatFile" class="chat-attach" />
                                                </form>
                                            </div>
                                        </div>
                                        <div class="chat-input" data-options="region:'center',border:false" contenteditable="true" style="height:100px;overflow-x:hidden;"></div>
                                    </div>
                                </div>
                            </div>
                            <!-- End: Chat -->
                        </div>
                    </div>
                </div>
            </div>
            <div data-options="region:'center',border:false" style="width:70%">
                <div class="easyui-layout" data-options="fit:true">
                    <div data-options="region:'north',border:false" class="ws-widget" style="height:60%">
                        <div id="panel-desktop" class="easyui-panel" title="Рабочий стол" data-options="fit:true,iconCls:'fa fa-desktop',maximizable:true">&nbsp;</div>
                    </div>
                    <div data-options="region:'center',border:false">
                        <div class="easyui-layout" data-options="fit:true">
                            <div data-options="region:'center',border:false" class="ws-widget">
                                <div id="panel-protocol" class="easyui-panel" title="Протокол" data-options="fit:true,iconCls:'fa fa-file-text-o',maximizable:true">
                                    <!-- Begin: Protocol -->
                                    <div class="easyui-panel protocol-panel" data-options="fit:true,border:false">
                                        <ul class="protocol-output" style="list-style-type: none;padding:.3em;margin:0"></ul>
                                    </div>
                                    <!-- End: Protocol -->
                                </div>
                            </div>
                            <div data-options="region:'east',border:false,minWidth:300" class="ws-widget" style="width:30%">
                                <div id="panel-notes" class="easyui-panel" title="Заметки" data-options="fit:true,iconCls:'fa fa-check-square-o',maximizable:true">
                                    <!-- Begin: Notes -->
                                    <div class="easyui-layout" data-options="fit:true">
                                        <div data-options="region:'north',border:false" style="height:33px;border-bottom-width: 1px;">
                                            <button class="easyui-linkbutton note-add-btn" data-options="plain:true,iconCls:'fa fa-plus'" style="float:right;margin:.2em">Добавить</button>
                                            <div style="overflow: hidden; padding: .4em;">
                                                <input class="easyui-textbox note-input" style="width: 100%;" data-options="prompt:'Введите текст заметки...'">
                                            </div>
                                        </div>
                                        <div data-options="region:'center',border:false">
                                            <div class="easyui-panel notes-panel" data-options="fit:true,border:false">
                                                <ul class="notes-list" style="list-style-type: none; padding: .3em; margin:0"></ul>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- End: Notes -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div data-options="region:'south',border:false" style="margin-top:1px;">
        <div class="easyui-panel" style="padding:5px;height:28px;" data-options="fit:true">
            <span class="easyui-linkbutton" data-options="plain:true,iconCls:'fa fa-exchange'">Качество связи: <strong><span class="network-widget">100%</span>
            </strong>
            </span>
            <span class="easyui-linkbutton" data-options="plain:true,iconCls:'fa fa-clock-o'">Текущее время: <strong><span class="time-widget">00:00:00</span>
            </strong>
            </span>
            <span class="easyui-linkbutton" data-options="plain:true,iconCls:'fa fa-history'">Продолжительность: <strong><span class="duration-widget">00:00:00</span>
            </strong>
            </span>
            <button class="easyui-linkbutton exam-stop-btn" data-options="iconCls:'fa fa-ban'" style="float:right;color:red;margin-left:5px;">Прервать</button>
            <button class="easyui-linkbutton exam-apply-btn" data-options="iconCls:'fa fa-check'" style="float:right;color:green;">Подписать</button>
        </div>
    </div>
</div>
<!-- Dialogs -->
<div id="student-info-dlg" class="easyui-dialog" title="Карточка студента" style="width:800px;height:410px;" data-options="iconCls:'fa fa-user',resizable:true,modal:true,closed:true"></div>
<div id="subject-info-dlg" class="easyui-dialog" title="Карточка экзамена" style="width:600px;height:400px;" data-options="iconCls:'fa fa-tags',resizable:true,modal:true,closed:true"></div>
<div id="note-dlg" class="easyui-dialog" style="padding:0 5px 5px 5px;width:400px;height:270px;" data-options="closed:true,modal:true">
    <form>
        <p>Заметка на <strong class="note-time"></strong></p>
        <input type="text" name="text" class="easyui-textbox note-text" data-options="width:'100%',height:150,multiline:true,prompt:'Введите текст заметки...'">
    </form>
</div>
<!-- Templates -->
<script type="text/template" id="subject-info-tpl">
<table width="100%" cellpadding="5">
    <tr>
        <td><strong>ID:</strong></td>
        <td>
            <%= examId %><br>
        </td>
    </tr>
    <tr>
        <td><strong>Экзамен:</strong></td>
        <td>
            <%= subject.title %><br>
        </td>
    </tr>
    <tr>
        <td><strong>Направление:</strong></td>
        <td>
            <%= subject.speciality %>
        </td>
    </tr>
    <tr>
        <td><strong>Код:</strong></td>
        <td>
            <%= subject.code %>
        </td>
    </tr>
    <tr>
        <td><strong>Начало:</strong></td>
        <td>
            <%= moment(beginDate).format("DD.MM.YYYY HH:mm") %>
        </td>
    </tr>
    <tr>
        <td><strong>Окончание:</strong></td>
        <td>
            <%= moment(endDate).format("DD.MM.YYYY HH:mm") %>
        </td>
    </tr>
</table>
</script>
<script type="text/template" id="student-info-tpl">
<div style="padding:15px">
    <img src="<%= student.photo %>" alt="Фотография" width="240" height="320" style="border: 1px solid #eee; float:left; margin-right: 15px">
    <div style="float:clear">
    <table cellpadding="5">
    <tr>
        <td>ФИО:</td>
        <td><%= passport.lastname %> <%= passport.firstname %> <%= passport.middlename %></td>
    </tr>
    <tr>
        <td>Пол:</td>
        <td><%= passport.gender %></td>
    </tr>
    <tr>
        <td>Дата рождения:</td>
        <td><%= moment(passport.birthday).format("DD.MM.YYYY") %></td>
    </tr>
    <tr>
        <td>Гражданство:</td>
        <td><%= passport.citizenship %></td>
    </tr>
    <tr>
        <td>Место рождения:</td>
        <td><%= passport.birthplace %></td>
    </tr>
    <tr>
        <td>Паспорт:</td>
        <td><%= passport.series %> <%= passport.number %></td>
    </tr>
    <tr>
        <td>Кем выдан:</td>
        <td><%= passport.department %></td>
    </tr>
    <tr>
        <td>Дата выдачи:</td>
        <td><%= moment(passport.issuedate).format("DD.MM.YYYY") %></td>
    </tr>
    <tr>
        <td>Код подразделения:</td>
        <td><%= passport.departmentcode %></td>
    </tr>
    <tr>
        <td>Место регистрации:</td>
        <td><%= passport.registration %></td>
    </tr>
    <tr>
        <td>Дополнительная информация:</td>
        <td><%= passport.description %></td>
    </tr>
    <tr>
        <td>Копии страниц паспорта:</td>
        <td><a href="#">страницы 1-2</a>, <a href="#">страница 4</a></td>
    </tr>
    </table>
    </div>
</div>
</script>
<script type="text/template" id="note-item-tpl">
<div class="note-view">
    <span style="font-weight: bold;padding-right:1em"><%- time %></span><span><%= text %></span>&nbsp;
    <a href="javascript:void(0);" class="note-edit">edit</a>
    <a href="javascript:void(0);" class="note-remove">del</a>
</div>
</script>
<script type="text/template" id="chat-item-tpl">
<div class="chat-view">
    <span style="font-weight: bold;padding-right:1em;color:<%- color %>"><%- time %> <%- author %></span><span><%= text %></span>
</div>
</script>
<script type="text/template" id="protocol-item-tpl">
<div class="chat-view">
    <span style="font-weight: bold;padding-right:1em"><%- time %></span><span><%= text %></span>
</div>
</script>