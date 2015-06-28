<div id="settings">
    <form class="settings-form">
        <div class="easyui-tabs" data-options="border:false">
            <div title="Вебкамера" style="padding:10px">
                <table cellpadding="5">
                    <tr>
                        <td>Микрофон:</td>
                        <td>
                            <input class="easyui-combobox webcamera-audio" name="webcamera-audio" data-options="width:300,editable:false,panelHeight:'auto',valueField:'name',textField:'value'">
                        </td>
                    </tr>
                    <tr>
                        <td>Видео:</td>
                        <td>
                            <input class="easyui-combobox webcamera-video" name="webcamera-video" data-options="width:300,editable:false,panelHeight:'auto',valueField:'name',textField:'value'">
                        </td>
                    </tr>
                    <tr>
                        <td>Разрешение:</td>
                        <td>
                            <select class="easyui-combobox webcamera-resolution" name="webcamera-resolution" data-options="width:120,editable:false,panelHeight:'auto',valueField:'name',textField:'value'">
                                <option value="1280x720">1280 x 720</option>
                                <option value="960x720">960 x 720</option>
                                <option value="854x480">854 x 480</option>
                                <option value="640x480">640 x 480</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>Частота кадров:</td>
                        <td>
                            <input class="easyui-numberspinner webcamera-fps" name="webcamera-fps" data-options="width:120" value="15">
                        </td>
                    </tr>
                </table>
            </div>
            <div title="Экран" style="padding:10px">
                <table cellpadding="5">
                    <tr>
                        <td>Номер экрана:</td>
                        <td>
                            <input class="easyui-textbox screen-id" type="text" name="screen-id" readonly="true" value="screen:0" data-options="width:230"></input>
                            <button class="easyui-linkbutton screen-btn" type="button" data-options="plain:true">Выбрать</button>
                        </td>
                    </tr>
                    <tr>
                        <td>Разрешение:</td>
                        <td>
                            <select class="easyui-combobox screen-resolution" name="screen-resolution" data-options="width:120,editable:false,panelHeight:'auto',valueField:'name',textField:'value'">
                                <option value="1280x720">1280 x 720</option>
                                <option value="960x720">960 x 720</option>
                                <option value="854x480">854 x 480</option>
                                <option value="640x480">640 x 480</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>Частота кадров:</td>
                        <td>
                            <input class="easyui-numberspinner screen-fps" name="screen-fps" data-options="width:120" value="5">
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </form>
</div>
