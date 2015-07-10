var express = require('express');
var router = express.Router();
var db = require('../db');
router.get('/', function(req, res) {
    var args = {
        rows: req.query.rows,
        page: req.query.page,
        status: req.query.status,
        from: req.query.from,
        to: req.query.to,
        text: req.query.text
    }
    db.exam.search(args, function(err, data, count) {
        if (!err && data) {
            res.json({
                "total": count,
                "rows": data
            });
        }
        else {
            res.json({
                "total": 0,
                "rows": []
            });
        }
    });
});
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id
    }
    db.vision.start(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('change-' + args.examId);
        }
        else {
            res.status(400).end();
        }
    });
});
router.put('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        resolution: req.body.resolution,
        comment: req.body.comment
    }
    db.vision.finish(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('change-' + args.examId);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;