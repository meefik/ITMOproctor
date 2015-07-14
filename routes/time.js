var express = require('express');
var router = express.Router();
var moment = require('moment');
// List all events
router.get('/', function(req, res) {
    res.json({
        time: moment().toJSON()
    });
});
module.exports = router;