var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../db');
router.get('/', function(req, res) {
    var args = {
        userId: req.user._id,
        history: req.query.history == 1 ? true : false
    }
    db.student.list(args, function(err, data) {
        if (!err && data.length > 0) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id
    }
    db.student.start(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;