var express = require('express');
var router = express.Router();
var db = require('../db');
// Get exam info by id
router.get('/:examId', function(req, res) {
  var args = {
    examId: req.params.examId
  };
  db.exam.get(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});
// Update exam
router.put('/:examId', function(req, res) {
  var args = {
    examId: req.params.examId,
    data: req.body
  };
  db.exam.update(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});
// Create exam
router.post('/', function(req, res) {
  var args = {
    data: req.body
  };
  db.exam.add(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});
// Delete exam
router.delete('/:examId', function(req, res) {
  var args = {
    examId: req.params.examId
  };
  db.exam.remove(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});
module.exports = router;
