var express = require('express');
var router = express.Router();
router.get('/main', function(req, res) {
    res.render('main');
});
router.get('/monitor', function(req, res) {
    res.render('monitor');
});
router.get('/chat', function(req, res) {
    res.render('chat');
});
module.exports = router;