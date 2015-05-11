var express = require('express');
var router = express.Router();
var moment = require('moment');
var dao = require('../db/dao');
router.get('/:examId', function(req, res) {
    dao.vision.info(req.params, function(err, data) {
        req.user.examId = data._id;
        res.json(data);
    });
});
module.exports = router;