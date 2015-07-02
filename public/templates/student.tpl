<div id="student" class="easyui-layout" data-options="fit:true">
    <div data-options="region:'north',border:false" style="margin-bottom:1px;">
        <div class="easyui-panel" style="padding:5px;height:28px;" data-options="fit:true">
            <span class="easyui-tooltip text-item observers-widget" title="Наблюдатели не подключены"><i class="fa fa-eye"></i><span class="curator-widget">Ожидайте инспектора...</span></span>
            <span class="easyui-menubutton" data-options="menu:'#main-menu',iconCls:'fa fa-bars'" style="float:right"></span>
        </div>
    </div>
    <div class="ws-content" data-options="region:'center',border:false">
        <div class="easyui-layout" data-options="fit:true">
            <div data-options="region:'north',border:false" class="ws-widget" style="height:50%">
                <div id="panel-webcam" class="easyui-panel ws-panel" title="Видеокамера" data-options="fit:true,iconCls:'fa fa-video-camera',maximizable:true">
                    <!-- Begin: Webcam -->
                    <video class="video-output" autoplay poster="images/webrtc.png"></video>
                    <video class="video-input" autoplay poster="images/webrtc.png"></video>
                    <!-- End: Webcam -->
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
                                <div class="chat-input" data-options="region:'center',border:false" placeholder="Текст сообщения..." contenteditable="true" style="height:80px;overflow-x:hidden;padding:.3em"></div>
                            </div>
                        </div>
                    </div>
                    <!-- End: Chat -->
                </div>
            </div>
        </div>
    </div>
    <div data-options="region:'south',border:false" style="margin-top:1px;">
        <div class="easyui-panel" style="padding:5px;height:28px;" data-options="fit:true">
            <span class="easyui-tooltip text-item" title="Качество связи"><i class="fa fa-exchange"></i><span class="panel-widget network-widget">100%</span></span>
            <span class="easyui-tooltip text-item" title="Текущее время"><i class="fa fa-clock-o"></i><span class="panel-widget time-widget">00:00:00</span></span>
            <span class="easyui-tooltip text-item" title="Длительность экзамена"><i class="fa fa-play"></i><span class="panel-widget duration-widget">00:00:00</span></span>
        </div>
    </div>
</div>
<!-- Begin: Screen -->
<div id="panel-screen" style="display:none">
    <video class="video-input" autoplay poster="images/webrtc.png"></video>
</div>
<!-- End: Screen -->
<div id="main-menu" style="width:150px;">
    <div name="info" data-options="iconCls:'fa fa-tags'">Об экзамене</div>
    <div class="menu-sep"></div>
    <div name="profile" data-options="iconCls:'fa fa-user'">Профиль</div>
    <div name="settings" data-options="iconCls:'fa fa-wrench'">Настройки</div>
    <div class="menu-sep"></div>
    <div name="logout" data-options="iconCls:'fa fa-sign-out'">Выход</div>
</div>
<div id="exam-info-dlg" class="easyui-dialog" title="Карточка экзамена" style="width:500px;height:350px;" data-options="resizable:true,closed:true"></div>
<!-- Templates -->
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