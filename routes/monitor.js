var express = require('express');
var router = express.Router();
var db = require('../db');
router.get('/', function(req, res) {
    db.monitor.list(req.query, function(err, data, count) {
        if(!err && data) {
            var rows = {
                "total": count,
                "rows": data
            }
            res.json(rows);
        } else {
            res.status(400).end();
        }
    });
});
router.get('/:examId', function(req, res) {
    db.monitor.info(req.params, function(err, data) {
        if(!err && data) {
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
module.exports = router;