var express = require('express');
var router = express.Router();
var dao = require('../db/dao');
router.get('/', function(req, res) {
    console.log(req.query);
    dao.monitor.list(req.query, function(err, exam, count) {
        if(err) {
            console.error(err);
            res.status(500).end();
        } else {
            var data = {
                "total": count,
                "rows": exam
            }
            res.json(data);
        }
    });
});
router.get('/:examId', function(req, res) {
    dao.monitor.info(req.params, function(err, exam) {
        if(err) {
            console.error(err);
            res.status(500).end();
        } else {
            res.json(exam);
        }
    });
});
module.exports = router;