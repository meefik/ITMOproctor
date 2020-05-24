var express = require('express');
var router = express.Router();
var db = require('../db');
var members = require('./members');
var api = require('./api');
var config = require('nconf');
// Get list of exams
router.get('/exams', api.fetchExams, function(req, res) {
  var args = {
    userId: req.user._id,
    data: req.query
  };
  db.exam.list(args, function(err, data) {
    if (!err && data) {
      res.json({
        offset: config.get('schedule:offset'),
        total: data.length,
        rows: data
      });
    } else {
      res.json({
        total: 0,
        rows: []
      });
    }
  });
});
// Get exam info by id
router.get('/info/:examId', function(req, res) {
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
// Start exam
router.get('/exam/:examId', members.updateMember, function(req, res) {
  var args = {
    examId: req.params.examId,
    userId: req.user._id
  };
  db.exam.start(args, function(err, data) {
    if (!err && data) {
      res.json(data);
      req.notify('exam', data);
    } else {
      res.status(400).end();
    }
  });
});
// Planing exam by id
router.put('/exam/:examId', function(req, res) {
  var args = {
    examId: req.params.examId,
    userId: req.user._id,
    data: req.body
  };
  if (!args.data.beginDate) {
    return res.status(400).end();
  }
  db.exam.plan(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});
// Cancel exam by id
router.delete('/exam/:examId', function(req, res) {
  var args = {
    examId: req.params.examId,
    userId: req.user._id
  };
  db.exam.cancel(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});
// Get free dates for planning
router.get('/schedule', function(req, res) {
  var args = {
    data: req.query
  };
  if (!args.data.leftDate || !args.data.rightDate || !args.data.duration) {
    return res.status(400).end();
  }
  db.exam.schedule(args, function(err, data) {
    if (!err && data) {
      res.json(data.dates);
    } else {
      res.status(400).end();
    }
  });
});
module.exports = router;
