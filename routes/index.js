var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  //res.render('index', { title: 'Express' });
  res.render('index');
});

router.get('/monitor', function(req, res) {
  res.render('monitor');
});

router.get('/chat', function(req, res) {
  res.render('chat');
});

module.exports = router;
