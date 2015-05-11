var express = require('express');
var router = express.Router();
var moment = require('moment');
var dao = require('../db/dao');
// List all events
router.get('/', function(req, res) {
    var args = {
        examId: req.user.examId
    };
    dao.protocol.list(args, function(err, data) {
        res.json(data);
    });
});
module.exports = router;