<div id="vision" class="easyui-layout" data-options="fit:true">
    <div data-options="region:'north',border:false" style="margin-bottom:1px;">
        <div class="easyui-panel" style="padding:5px;height:28px;" data-options="fit:true">
            <a href="javascript:void(0)" class="easyui-linkbutton screenshot-btn" data-options="plain:true,iconCls:'fa fa-camera'">Снимок экрана</a>
            <span class="easyui-menubutton" data-options="menu:'#main-menu',iconCls:'fa fa-bars'" style="float:right"></span>
            <a href="javascript:void(0)" class="easyui-linkbutton student-info-btn" data-options="plain:true,iconCls:'fa fa-user'" style="float:right"><span class="student-widget">...</span></a>
            <a href="javascript:void(0)" class="easyui-linkbutton exam-info-btn" data-options="plain:true,iconCls:'fa fa-tags'" style="float:right"><span class="exam-widget">...</span></a>
        </div>
    </div>
    <div class="ws-content" data-options="region:'center',border:false">
        <div class="easyui-layout" data-options="fit:true">
            <div data-options="region:'west',border:false" style="width:30%">
                <div class="easyui-layout" data-options="fit:true">
                    <div data-options="region:'north',border:false" class="ws-widget" style="height:40%">
                        <div id="panel-webcam" class="easyui-panel ws-panel" title="Видеокамера" data-options="fit:true,iconCls:'fa fa-video-camera',maximizable:true">
                            <!-- Begin: Webcam -->
                            <video class="video-output" autoplay poster="images/webrtc.png"></video>
                            <video class="video-input" autoplay poster="images/webrtc.png"></video>
                            <!-- End: Webcam -->
                            &nbsp;
                        </div>
                    </div>
                    <div data-options="region:'center',border:false" class="ws-widget">
                        <div id="panel-chat" class="easyui-panel ws-panel" title="Сообщения" data-options="fit:true,iconCls:'fa fa-comments-o',maximizable:true">
                            <!-- Begin: Chat -->
                            <div class="easyui-layout" data-options="fit:true">
                                <div class="chat-panel" data-options="region:'center',border:false" style="overflow-x:hidden;word-wrap:break-word;">
                                    <ul class="chat-output" style="list-style-type:none; padding:.3em; margin:0"></ul>
                                </div>
                                <div data-options="region:'south',split:true,border:false">
                                    <div class="easyui-layout" data-options="fit:true">
                                        <div data-options="region:'north',border:false">
                                            <div class="easyui-panel" data-options="fit:true" style="padding:3px;border-left:0;border-right:0;height:28px;">
                                                <button class="easyui-linkbutton chat-file-btn" data-options="plain:true,iconCls:'fa fa-download'" style="float:left;display:none;">
                                                    <div class="easyui-progressbar chat-progress" data-options="width:150,height:18" style="margin:3px 0 3px 0"></div>
                                                </button>
                                                <button class="easyui-linkbutton chat-send-btn" data-options="plain:true,iconCls:'fa fa-paper-plane-o'" style="float:right">Отправить</button>
                                                <button class="easyui-linkbutton chat-attach-btn" data-options="plain:true,iconCls:'fa fa-paperclip'" style="float:right">Прикрепить</button>
                                                <form method="post" enctype="multipart/form-data" style="display:none;">
                                                    <input type="file" name="chatFile" class="chat-attach-input" />
                                                </form>
                                            </div>
                                        </div>
                                        <div class="chat-input" data-options="region:'center',border:false" placeholder="Текст сообщения..." contenteditable="true" style="height:100px;overflow-x:hidden;padding:.3em"></div>
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
                    <div data-options="region:'north',border:false" class="ws-widget" style="height:70%">
                        <div id="panel-screen" class="easyui-panel ws-panel" title="Рабочий стол" data-options="fit:true,iconCls:'fa fa-desktop',maximizable:true">
                            <!-- Begin: Screen -->
                            <video class="video-output" autoplay poster="images/webrtc.png"></video>
                            <!-- End: Screen -->
                        </div>
                    </div>
                    <div data-options="region:'center',border:false">
                        <div class="easyui-layout" data-options="fit:true">
                            <div data-options="region:'center',border:false" class="ws-widget">
                                <div id="panel-protocol" class="easyui-panel ws-panel" title="Протокол" data-options="fit:true,iconCls:'fa fa-file-text-o',maximizable:true">
                                    <!-- Begin: Protocol -->
                                    <div class="easyui-panel protocol-panel" data-options="fit:true,border:false">
                                        <ul class="protocol-output" style="list-style-type: none;padding:.3em;margin:0"></ul>
                                    </div>
                                    <!-- End: Protocol -->
                                </div>
                            </div>
                            <div data-options="region:'east',border:false,minWidth:300" class="ws-widget" style="width:30%">
                                <div id="panel-notes" class="easyui-panel ws-panel" title="Заметки" data-options="fit:true,iconCls:'fa fa-check-square-o',maximizable:true">
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
            <span class="text-item"><i class="fa fa-exchange"></i>Качество связи: <span class="network-widget" style="font-weight:bold">100%</span></span>
            <span class="text-item"><i class="fa fa-clock-o"></i>Текущее время: <span class="time-widget" style="font-weight:bold">00:00:00</span></span>
            <span class="text-item"><i class="fa fa-play"></i>Продолжительность: <span class="duration-widget" style="font-weight:bold">00:00:00</span></span>
            <a href="javascript:void(0)" class="easyui-linkbutton exam-stop-btn" data-options="iconCls:'fa fa-ban'" style="float:right;color:red;margin-left:5px;">Прервать</a>
            <a href="javascript:void(0)" class="easyui-linkbutton exam-apply-btn" data-options="iconCls:'fa fa-check'" style="float:right;color:green;">Подписать</a>
        </div>
    </div>
</div>
<div id="main-menu" style="width:150px;">
    <div name="profile" data-options="iconCls:'fa fa-user'">Профиль</div>
    <div name="settings" data-options="iconCls:'fa fa-wrench'">Настройки</div>
    <div class="menu-sep"></div>
    <div name="logout" data-options="iconCls:'fa fa-sign-out'">Выход</div>
</div>
<!-- Dialogs -->
<div id="student-info-dlg" class="easyui-dialog" title="Карточка студента" style="width:800px;height:410px;" data-options="resizable:true,closed:true"></div>
<div id="exam-info-dlg" class="easyui-dialog" title="Карточка экзамена" style="width:500px;height:350px;" data-options="resizable:true,closed:true"></div>
<div id="note-dlg" class="easyui-dialog" style="padding:0 5px 5px 5px;width:400px;height:270px;" data-options="closed:true,modal:true">
    <form>
        <p>Заметка на <strong class="note-time"></strong></p>
        <input type="text" name="text" class="easyui-textbox note-text" data-options="width:'100%',height:150,multiline:true,prompt:'Введите текст заметки...'">
    </form>
</div>
<div id="screenshot-dlg" class="easyui-dialog" title="Снимок экрана" style="padding:5px;width:500px;height:415px;text-align:center;" data-options="modal:true,closed:true">
    <img alt="Снимок экрана" style="height:240px;width:auto;max-width:100%;max-height:240px;margin-bottom:5px;">
    <input type="text" class="easyui-textbox screenshot-comment" data-options="width:'100%',height:80,multiline:true,prompt:'Введите комментарий...'">
</div>
<div id="exam-confirm-dlg" style="padding:5px" title="Завершить экзамен" data-options="width:350,height:245,modal:true,closed:true">
    <div style="padding-bottom:10px">Подтвердите свое решение <strong class="reject-text" style="color:red;display:none">прервать</strong><strong class="apply-text" style="color:green">подписать</strong> экзамен, отменить операцию будет невозможно.</div> 
    <div style="padding-bottom:5px">Введите код подтверждения: <span class="protection-code" style="font-weight:bold;letter-spacing:1px;"></span></div>
    <input class="easyui-validatebox textbox protection-code-input" style="width:80px;font-size:12px;font-weight:bold;padding:3px;text-align:center;letter-spacing:2px;" maxlength="4">
    <div style="padding-top:10px;padding-bottom:3px">Комментарий:</div>
    <input class="easyui-textbox exam-comment" data-options="multiline:true,prompt:'Введите комментарий...'" style="width:100%;height:50px;">
</div>
<!-- Templates -->
<script type="text/template" id="exam-info-tpl">
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
    <tr>
        <td><strong>Студент:</strong></td>
        <td>
            <% if(student) { %>
                <%= student.lastname %> <%= student.firstname %> <%= student.middlename %> (<%= moment(student.birthday).format('DD.MM.YYYY') %>)
            <% } %>
        </td>
    </tr>
    <tr>
        <td><strong>Инспектор:</strong></td>
        <td>
            <% if(curator[0]) { %>
                <%= curator[0].lastname %> <%= curator[0].firstname %> <%= curator[0].middlename %>
            <% } %>
        </td>
    </tr>
    <tr>
        <td><strong>Наблюдатели:</strong></td>
        <td>
            <% curator.shift(); %>
            <% _.each(curator, function(item) { %>
                <%= item.lastname %> <%= item.firstname %> <%= item.middlename %><br>
            <% }); %>
        </td>
    </tr>
</table>
</script>
<script type="text/template" id="student-info-tpl">
<div style="padding:15px">
    <% var photo = student.photo.length > 0 ? '/storage/'+student.photo[0].fileId : null; %>
    <div style="width:240px;height:320px;float:left;margin-right:15px;">
        <img src="<%- photo %>" alt="Фотография" style="border:1px solid lightgray;height:auto;width:auto;max-width:100%;max-height:100%;">
    </div>
    <div style="float:clear">
    <table cellpadding="5">
    <tr>
        <td>ФИО:</td>
        <td><%- passport.lastname %> <%- passport.firstname %> <%- passport.middlename %></td>
    </tr>
    <tr>
        <td>Пол:</td>
        <td><%- passport.gender %></td>
    </tr>
    <tr>
        <td>Дата рождения:</td>
        <td><%- moment(passport.birthday).format("DD.MM.YYYY") %></td>
    </tr>
    <tr>
        <td>Гражданство:</td>
        <td><%- passport.citizenship %></td>
    </tr>
    <tr>
        <td>Место рождения:</td>
        <td><%- passport.birthplace %></td>
    </tr>
    <tr>
        <td>Паспорт:</td>
        <td><%- passport.series %> <%= passport.number %></td>
    </tr>
    <tr>
        <td>Кем выдан:</td>
        <td><%- passport.department %></td>
    </tr>
    <tr>
        <td>Дата выдачи:</td>
        <td><%- moment(passport.issuedate).format("DD.MM.YYYY") %></td>
    </tr>
    <tr>
        <td>Код подразделения:</td>
        <td><%- passport.departmentcode %></td>
    </tr>
    <tr>
        <td>Место регистрации:</td>
        <td><%- passport.registration %></td>
    </tr>
    <tr>
        <td>Дополнительная информация:</td>
        <td><%- passport.description %></td>
    </tr>
    <tr>
        <td>Копии страниц паспорта:</td>
        <td>
            <% if(passport.attach.length > 0) { %>
                <% _.each(passport.attach, function(element, index, list){ %>
                    <i class="fa fa-paperclip"></i>&nbsp;<a href="/storage/<%- element.fileId %>"><%- element.filename %></a>
                <% }); %>
            <% } %>
        </td>
    </tr>
    </table>
    </div>
</div>
</script>
<script type="text/template" id="note-item-tpl">
<div class="note-view" style="border-bottom:1px solid #efefef;width:100%;position:relative;" onmouseover="javascript:$(this).find('.edit-buttons').show();" onmouseout="javascript:$(this).find('.edit-buttons').hide();">
    <div style="padding:5px;">
            <span style="font-weight:bold;padding-right:.5em;"><%- moment(time).format('HH:mm') %></span>            
            <span style="white-space:pre-wrap;"><%= text %></span>        
            <% if(attach.length > 0) { %>
                <% _.each(attach, function(element, index, list){ %>
                    <i class="fa fa-paperclip"></i>&nbsp;<a href="/storage/<%- element.fileId %>"><%- element.filename %></a>
                <% }); %>
            <% } %>
    </div>
    <div class="edit-buttons" style="padding:0 5px 3px 8px;right:0;top:0;position:absolute;display:none;background-color:white;">
        <a href="javascript:void(0);" class="note-edit" style="font-size:1.3em;color:gray;padding-right:5px" title="Редактировать"><i class="fa fa-pencil"></i></a>
        <a href="javascript:void(0);" class="note-remove" style="font-size:1.4em;color:gray;" title="Удалить"><i class="fa fa-close"></i></a>
    </div>
</div>
</script>
<script type="text/template" id="chat-item-tpl">
<div class="chat-view">
    <% var color = app.profile.isMe(author._id) ? 'red' : 'blue'; %>
    <span style="font-weight: bold;padding-right:.5em;color:<%- color %>"><%- moment(time).format('HH:mm') %> <%- author.lastname %> <%- author.firstname.charAt(0) %>.<%- author.middlename.charAt(0) %>.:</span><span><%= text %>
        <% if(attach.length > 0) { %>
            <% _.each(attach, function(element, index, list){ %>
                <i class="fa fa-paperclip"></i>&nbsp;<a href="/storage/<%- element.fileId %>"><%- element.filename %></a>
            <% }); %>
        <% } %>
    </span>
</div>
</script>
<script type="text/template" id="protocol-item-tpl">
<div class="protocol-view">
    <span style="font-weight: bold;padding-right:.5em"><%- moment(time).format('HH:mm:ss') %></span><span><%= text %></span>
</div>
</script>