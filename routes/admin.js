var express = require('express');
var router = express.Router();
var db = require('../db');
// Get list of users
router.get('/users', function(req, res) {
    var args = {
        data: req.query
    };
    db.profile.search(args, function(err, data, count) {
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
// Get list of exams
router.get('/exams', function(req, res) {
    var args = {
        userId: req.user._id,
        myself: false,
        data: req.query
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
// Get list of schedules
router.get('/schedules', function(req, res) {
    var args = {
        data: req.query
    };
    db.schedule.search(args, function(err, data, count) {
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
module.exports = router;