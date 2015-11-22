var express = require('express');
var router = express.Router();
var db = require('../db');
// List all times for inspector
router.get('/', function(req, res) {
    console.log(req.user._id);
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
router.post('/', function(req, res) {
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
module.exports = router;