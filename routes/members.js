var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../db');
// List all events
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId
    };
    db.online.list(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;