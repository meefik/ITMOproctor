<div id="countdown" class="easyui-layout" data-options="fit:true">
    <div data-options="region:'north',border:false" style="margin-bottom:1px;">
        <div class="easyui-panel" style="padding:5px;height:28px;" data-options="fit:true">
            <span class="easyui-linkbutton" data-options="plain:true,iconCls:'fa fa-user'"><span class="student-widget">...</span></span>
        </div>
    </div>
    <div class="ws-content" data-options="region:'center',border:false">
        <div>
            Ближайший экзамен: <span class="exam-widget">...</span>
        </div>
        <div>
            До начала осталось: <span class="countdown-widget">...</span>
        </div>
        <br>
        <button class="start-btn" disabled="disabled">Начать</button>
    </div>
    <div data-options="region:'south',border:false" style="margin-top:1px;">
        <div class="easyui-panel" style="padding:5px;height:28px;" data-options="fit:true">
            <span class="easyui-linkbutton" data-options="plain:true,iconCls:'fa fa-clock-o'">Текущее время: <span class="time-widget" style="font-weight:bold">00:00:00</span></span>
            <a href="javascript:void(0)" class="easyui-linkbutton app-logout" data-options="plain:true,iconCls:'fa fa-sign-out'" style="float:right;">Выход</a>
        </div>
    </div>
</div>
