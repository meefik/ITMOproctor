var express = require('express');
var router = express.Router();
var db = require('../db');
var members = require('./members');
var api = require('./api');
// Get list of exams by search
router.get('/exam',
    function(req, res) {
        var args = {
            userId: req.user._id,
            rows: req.query.rows,
            page: req.query.page,
            myself: req.query.myself === 'false' ? false : true,
            from: req.query.from,
            to: req.query.to,
            text: req.query.text
        };
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
router.get('/exam/:examId',
    members.updateMember,
    function(req, res, next) {
        var args = {
            examId: req.params.examId,
            userId: req.user._id
        };
        db.exam.start(args, function(err, data) {
            if (!err && data) {
                res.json(data);
                req.notify('exam-' + args.examId, {
                    userId: args.userId
                });
            }
            else {
                res.status(400).end();
            }
        });
    });
// Verify exam (passport)
router.post('/exam/:examId',
    function(req, res, next) {
        var args = {
            verified: req.body.verified,
            userId: req.user._id,
            examId: req.params.examId
        };
        db.exam.verify(args, function(err, data) {
            if (!err && data) next();
            else res.status(400).end();
        });
    },
    api.startExam,
    function(req, res) {
        res.json({});
    });
// Stop exam
router.put('/exam/:examId',
    function(req, res, next) {
        var args = {
            examId: req.params.examId,
            userId: req.user._id,
            resolution: req.body.resolution,
            comment: req.body.comment
        };
        db.exam.finish(args, function(err, data) {
            if (!err && data) {
                next();
                req.notify('exam-' + args.examId, {
                    userId: args.userId
                });
            }
            else {
                res.status(400).end();
            }
        });
    },
    api.stopExam,
    function(req, res) {
        res.json({});
    });
// Exam status
router.get('/exam/:examId/status',
    api.examStatus,
    function(req, res) {
        if (req.body.examStatus) {
            res.json({
                status: req.body.examStatus
            });
        }
        else {
            res.end();
        }
    });
// List all times for inspector
router.get('/schedule',
    function(req, res) {
        var args = {
            inspector: req.user._id
        };
        db.schedule.list(args, function(err, data) {
            if (!err && data) {
                res.json(data);
            }
            else {
                res.status(400).end();
            }
        });
    });
// Create time
router.post('/schedule',
    function(req, res) {
        var args = {
            inspector: req.user._id,
            beginDate: req.body.beginDate,
            endDate: req.body.endDate,
            concurrent: req.body.concurrent
        };
        db.schedule.add(args, function(err, data) {
            if (!err && data) {
                res.json(data);
            }
            else {
                res.status(400).end();
            }
        });
    });
// Delete time
router.delete('/schedule/:scheduleId',
    function(req, res) {
        var args = {
            inspector: req.user._id,
            scheduleId: req.params.scheduleId
        };
        db.schedule.remove(args, function(err, data) {
            if (!err && data) {
                res.json(data);
            }
            else {
                res.status(400).end();
            }
        });
    });
module.exports = router;