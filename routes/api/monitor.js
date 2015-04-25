var express = require('express');
var router = express.Router();
var moment = require('moment');
router.get('/', function(req, res) {
    var r = req.query.rows;
    if(isNaN(r)) r = 100;
    var p = req.query.page;
    if(isNaN(p)) p = 1;
    var t = req.query.total;
    if(isNaN(t)) t = 1000;
    var status = req.query.status;
    var date = req.query.date;
    var text = req.query.text;
    // get data
    var rows = req.db.monitor.get(0, p * r);
    // filter
    var filtered = [];
    rows.forEach(function(entry) {
        if(typeof date !== "undefined") {
            var d = new Date(entry.date);
            if(date === moment(d).format('DD.MM.YYYY')) {
                filtered.push(entry);
            }
        }
        if(typeof status !== "undefined") {
            if(status === entry.status) {
                filtered.push(entry);
            }
        }
        if(typeof text !== "undefined") {
            if(text.indexOf(entry.text) > -1) {
                filtered.push(entry);
            }
        }
    });
    var data = {
        "total": t,
        "rows": rows
    }
    res.json(data);
});
module.exports = router;