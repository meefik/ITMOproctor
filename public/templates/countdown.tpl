<div id="countdown" class="easyui-layout" data-options="fit:true">
    <div data-options="region:'north',border:false" style="margin-bottom:1px;">
        <div class="easyui-panel" style="padding:5px;height:28px;" data-options="fit:true">
            <span class="text-item"><i class="fa fa-bell-o"></i>Ближайшие экзамены</span>
            <span class="easyui-menubutton" data-options="menu:'#main-menu',iconCls:'fa fa-bars'" style="float:right"></span>
        </div>
    </div>
    <div class="ws-content" data-options="region:'center',border:false">
        <table class="easyui-datagrid exams-table" data-options="singleSelect:true,border:false,fitColumns:true,fit:true"></table>
    </div>
    <div data-options="region:'south',border:false" style="margin-top:1px;">
        <div class="easyui-panel" style="padding:5px;height:28px;" data-options="fit:true">
            <span class="text-item"><i class="fa fa-clock-o"></i>Текущее время: <span class="time-widget" style="font-weight:bold">00:00:00</span></span>
            <span class="text-item"><i class="fa fa-history"></i>До начала осталось: <span class="countdown-widget" style="font-weight:bold">00:00:00</span></span>
            <!--<span class="easyui-linkbutton" data-options="plain:true,iconCls:'fa fa-clock-o'">Текущее время: <span class="time-widget" style="font-weight:bold">00:00:00</span></span>-->
            <a href="javascript:void(0)" class="easyui-linkbutton start-btn" data-options="disabled:true,iconCls:'fa fa-play'" style="float:right">Начать экзамен</a>
        </div>
    </div>
</div>
<div id="main-menu" style="width:150px;">
    <div name="history" data-options="iconCls:'fa fa-circle-o'">Прошедшие</div>
    <div class="menu-sep"></div>
    <div name="profile" data-options="iconCls:'fa fa-user'">Профиль</div>
    <div name="settings" data-options="iconCls:'fa fa-wrench'">Настройки</div>
    <div class="menu-sep"></div>
    <div name="logout" data-options="iconCls:'fa fa-sign-out'">Выход</div>
</div>