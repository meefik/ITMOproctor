var express = require('express');
var router = express.Router();

function dateFormat(d) {
    var y = d.getFullYear();
    var m = ("00" + (d.getMonth() + 1)).slice(-2);
    var d = ("00" + d.getDate()).slice(-2);
    return d + '.' + m + '.' + y;
}

router.post('/monitor', function(req, res) {
    var r = req.body.rows;
    if(isNaN(r)) r = 100;
    var p = req.body.page;
    if(isNaN(p)) p = 1;
    var t = req.query.total;
    if(isNaN(t)) t = 1000;
    var status = req.body.status;
    var date = req.body.date;
    var text = req.body.text;
    // demo prototype
    var proto = [{
        "id": "189221",
        "student": "Иванов И.И.",
        "exam": "Специальность 05.13.12",
        "date": 1426481205000,
        "duration": 1000000,
        "inspector": "Петров П.П.",
        "status": 1
    }, {
        "id": "189222",
        "student": "Сидоров С.С.",
        "exam": "Специальность 06.13.12",
        "date": 1424491305000,
        "duration": 1500000,
        "inspector": "Петров П.П.",
        "status": 2
    }, {
        "id": "189223",
        "student": "Иванова Р.П.",
        "exam": "Специальность 03.12.12",
        "date": 1429471505000,
        "duration": null,
        "inspector": "Григорьев В.А.",
        "status": 3
    }, {
        "id": "189224",
        "student": "Ефимова Г.Е.",
        "exam": "Специальность 01.10.12",
        "date": 1428161405000,
        "duration": null,
        "inspector": "Григорьев В.А.",
        "status": 4
    }];
    // generate rows
    var rows = [];
    for(var i = 0; i < r; i++) {
        var k = Math.floor(Math.random() * 4);
        rows.push(proto[k]);
    }
    // filter
    filtered = [];
    rows.forEach(function(entry) {
        if(typeof date !== "undefined") {
            var d = new Date(entry.date);
            if(date === dateFormat(d)) {
                console.log('ok');
                filtered.push(entry);
            }
        }
    });
    if(filtered.length == 0) filtered = rows;
    var data = {
        "total": t,
        "rows": filtered
    };
    res.json(data);
});
module.exports = router;