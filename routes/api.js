var express = require('express');
var router = express.Router();
var db = require('../db');
// Initialize session from edX
router.post('/edx/init', function(req, res) {
    var args = {
        duration: req.body.duration,
        examName: req.body.examName
    }
    console.log(req.body);
    req.status(200).end();
});
module.exports = router;