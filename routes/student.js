var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../db');
router.get('/', function(req, res) {
    var args = {
        userId: req.user._id
    }
    db.student.start(args, function(err, data) {
        if(!err && data) {
            req.user.examId = data._id;
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
module.exports = router;