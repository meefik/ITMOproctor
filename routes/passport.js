var express = require('express');
var router = express.Router();
var db = require('../db');
router.get('/:userId', function(req, res) {
    var args = {
        userId: req.params.userId
    }
    db.profile.passport(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;