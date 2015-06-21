<div class="profile-view"></div>
<script type="text/template" id="profile-tpl">
<div style="padding:15px">
    <% var photo = user.photo.length > 0 ? '/storage/'+user.photo[0].fileId : null; %>
    <div style="width:120px;height:160px;float:left;margin-right:15px;">
        <img src="<%- photo %>" alt="Фотография" style="border:1px solid lightgray;height:auto;width:auto;max-width:100%;max-height:100%;">
    </div>
    <div style="float:clear">
        <table cellpadding="5">
        <tr>
            <td>ФИО:</td>
            <td><%- user.lastname %> <%- user.firstname %> <%- user.middlename %></td>
        </tr>
        <tr>
            <td>Пол:</td>
            <td><%- user.gender %></td>
        </tr>
        <tr>
            <td>Дата рождения:</td>
            <td><%- moment(user.birthday).format("DD.MM.YYYY") %></td>
        </tr>
        <tr>
            <td>Электронный адрес:</td>
            <td><%- user.email %></td>
        </tr>
        </table>
    </div>
</div>