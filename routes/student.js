var express = require('express');
var router = express.Router();
var db = require('../db');
var members = require('./members');
var api = require('./api');
// Get list of exams
router.get('/', api.fetchExams, function(req, res) {
    var args = {
        userId: req.user._id,
        history: req.query.history === '1' ? true : false
    };
    db.exam.list(args, function(err, data) {
        if (!err && data) {
            res.json({
                "total": data.length,
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
            req.notify('exam', data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;