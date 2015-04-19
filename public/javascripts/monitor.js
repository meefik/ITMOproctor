app.monitor = {
    init: function() {
        var self = this;
        $('#monitor-date').datebox({
            onSelect: function(date) {
                self.doSearch();
            }
        });
        $('#monitor-search').searchbox({
            searcher: function(value, name) {
                self.doSearch();
            }
        });
        $('#monitor-date').datebox('options').keyHandler.query = function(q) {
            if(q === '') {
                self.doSearch();
            }
        }
        var t1 = setInterval(function() {
            $('#time-widget').text(moment().format('HH:mm:ss'));
        }, 1000);
        this.timers = [t1];
    },
    destroy: function() {
        this.timers.forEach(function(element, index, array) {
            clearInterval(element);
        });
        delete app.monitor;
    },
    formatStatus: function(val, row) {
        switch(val) {
            case 1:
                return '<span style="color:red;">Идет</span>';
            case 2:
                return '<span style="color:orange;">Ожидает</span>';
            case 3:
                return '<span style="color:green;">Сдан</span>';
            case 4:
                return '<span style="color:gray;">Прерван</span>';
            default:
                return null;
        }
    },
    formatAction: function(val, row) {
        var out = '<a href="javascript:void(0);" style="padding:0 8px 0 8px;" onclick="app.monitor.doInfo(\'' + row.id + '\');" title="Информация"><i class="fa fa-info-circle fa-lg"></i></a>';
        out += '<a href="javascript:void(0);" style="padding:0 8px 0 8px;" onclick="app.monitor.doPlay(\'' + row.id + '\');" title="Открыть"><i class="fa fa-play-circle fa-lg"></i></a>';
        return out;
    },
    formatDuration: function(val, row) {
        if(val == null) return null;
        else {
            var d = new Date(val);
            return moment(d).utc().format('HH:mm:ss');
        }
    },
    formatDate: function(val, row) {
        if(val == null) return null;
        else {
            var d = new Date(val);
            return moment(d).format('DD.MM.YYYY HH:mm:ss');
        }
    },
    doSearch: function() {
        var status = 0;
        if($('#monitor-status-1').linkbutton('options').selected) status = 1;
        if($('#monitor-status-2').linkbutton('options').selected) status = 2;
        if($('#monitor-status-3').linkbutton('options').selected) status = 3;
        var date = $('#monitor-date').datebox('getValue');
        var text = $('#monitor-search').textbox('getValue');
        $('#monitor-grid').datagrid('load', {
            status: status,
            date: date,
            text: text
        });
    },
    doReload: function() {
        $('#monitor-grid').datagrid('reload');
    },
    doInfo: function(rowid) {
        console.log("info " + rowid);
    },
    doPlay: function(rowid) {
        app.doNavigate('#workspace');
    }
}