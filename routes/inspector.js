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
// Start exam
router.get('/:examId', members.updateMember, function(req, res, next) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id
    };
    db.exam.start(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('exam-' + req.params.examId, {
                userId: args.userId
            });
        }
        else {
            res.status(400).end();
        }
    });
});
// Stop exam
router.put('/:examId', function(req, res, next) {
    var args = {
        examId: req.params.examId
    };
    db.exam.info(args, function(err, data) {
        if (!err && data) {
            req.body.provider = data.student.provider;
            req.body.examCode = data.examCode;
            req.body._id = data._id;
            req.body.resolution = data.resolution;
            req.body.comment = data.comment;
            next();
        }
        else {
            res.status(400).end();
        }
    });
}, api.stopExam, function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        resolution: req.body.resolution,
        comment: req.body.comment
    };
    db.exam.finish(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
    req.notify('exam-' + req.params.examId, {
        userId: args.userId
    });
});
// Verify passport
router.post('/:examId', function(req, res, next) {
    var args = {
        examId: req.params.examId
    };
    db.exam.info(args, function(err, data) {
        if (!err && data) {
            req.body.provider = data.student.provider;
            req.body.examCode = data.examCode;
            next();
        }
        else {
            res.status(400).end();
        }
    });
}, /*api.startExam,*/ function(req, res) {
    var args = {
        student: req.body.student,
        userId: req.user._id,
        examId: req.params.examId
    };
    db.exam.verify(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;