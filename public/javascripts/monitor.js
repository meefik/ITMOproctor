var monitor = new Monitor();

function Monitor() {
    this.formatStatus = function(val, row) {
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
    }
    this.formatAction = function(val, row) {
        var out = '<a href="#" style="padding:0 8px 0 8px;" onclick="monitor.doInfo(\'' + row.id + '\');" title="Информация"><i class="fa fa-info-circle fa-lg"></i></a>';
        out += '<a href="#" style="padding:0 8px 0 8px;" onclick="monitor.doPlay(\'' + row.id + '\');" title="Воспроизвести"><i class="fa fa-play-circle fa-lg"></i></a>';
        return out;
    }
    this.formatDuration = function(val, row) {
        if(val == null) return null;
        else {
            var d = new Date(val);
            return durationToString(d);
        }
    }
    this.formatDate = function(val, row) {
        if(val == null) return null;
        else {
            var d = new Date(val);
            return dateToString(d);
        }
    }
    this.doSearch = function() {
        var status = 0;
        if($('#monitor-status-1').linkbutton('options').selected) status = 1;
        if($('#monitor-status-2').linkbutton('options').selected) status = 2;
        if($('#monitor-status-3').linkbutton('options').selected) status = 3;
        var date = $('#monitor-date').datebox('getValue');
        var text = $('#monitor-search').textbox('getValue');
        $('#monitor-datagrid').datagrid('load', {
            status: status,
            date: date,
            text: text
        });
    }
    this.doReload = function() {
        $('#monitor-datagrid').datagrid('reload');
    }
    this.doInfo = function(rowid) {
        console.log("info " + rowid);
    }
    this.doPlay = function(rowid) {
        showContent('#content', '/pages/workspace');
    }

    this.init = function() {
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
        setInterval(function() {
            var d = new Date();
            $('#time-widget').text(timeToString(d));
        }, 1000);
    }

    function dateToString(d) {
        year = "" + d.getFullYear();
        month = "" + (d.getMonth() + 1);
        if(month.length == 1) {
            month = "0" + month;
        }
        day = "" + d.getDate();
        if(day.length == 1) {
            day = "0" + day;
        }
        hour = "" + d.getHours();
        if(hour.length == 1) {
            hour = "0" + hour;
        }
        minute = "" + d.getMinutes();
        if(minute.length == 1) {
            minute = "0" + minute;
        }
        second = "" + d.getSeconds();
        if(second.length == 1) {
            second = "0" + second;
        }
        return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
    }

    function durationToString(d) {
        hour = "" + d.getUTCHours();
        if(hour.length == 1) {
            hour = "0" + hour;
        }
        minute = "" + d.getUTCMinutes();
        if(minute.length == 1) {
            minute = "0" + minute;
        }
        second = "" + d.getUTCSeconds();
        if(second.length == 1) {
            second = "0" + second;
        }
        return hour + ":" + minute + ":" + second;
    }

    function timeToString(d, utc) {
        if(utc) return("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
        else return("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2);
    }
}