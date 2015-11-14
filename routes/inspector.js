var express = require('express');
var router = express.Router();
var db = require('../db');
var members = require('./members');
var api = require('./api');
// Get list of exams
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
// Update exam state
router.put('/:examId', function(req, res, next) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        resolution: req.body.resolution,
        comment: req.body.comment
    };
    if (args.resolution != null) {
        db.exam.finish(args, function(err, data) {
            if (!err && data) {
                req.exam = data;
                api.stopExam(req, res, next);
            }
            else {
                res.status(400).end();
            }
        });
    }
    else {
        db.exam.start(args, function(err, data) {
            if (!err && data) {
                req.exam = data;
                next();
            }
            else {
                res.status(400).end();
            }
        });
    }
}, members.updateMember, function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        exam: req.exam
    };
    res.json(args.exam);
    req.notify('exam-' + req.params.examId, {
        userId: args.userId
    });
});
// Unlock exam
router.post('/:examId', function(req, res, next) {
    req.exam = req.body;
    api.startExam(req, res, next);
}, function(req, res){
    res.json({});
});
module.exports = router;