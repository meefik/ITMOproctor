var express = require('express');
var router = express.Router();
var db = require('../db');
var members = require('./members');
var api = require('./api');
// Get list of exams by search
router.get('/exams', function(req, res) {
  var args = {
    userId: req.user._id,
    data: req.query
  };
  db.exam.search(args, function(err, data, count) {
    if (!err && data) {
      res.json({
        total: count,
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
// Start exam
router.get('/exam/:examId', members.updateMember, function(req, res) {
  var args = {
    examId: req.params.examId,
    userId: req.user._id
  };
  db.exam.start(args, function(err, data) {
    if (!err && data) {
      res.json(data);
      req.notify('exam-' + args.examId, {
        userId: args.userId
      });
    } else res.status(400).end();
  });
});
// Stop exam
router.put(
  '/exam/:examId',
  function(req, res, next) {
    var args = {
      examId: req.params.examId,
      userId: req.user._id,
      data: req.body
    };
    db.exam.finish(args, function(err, data) {
      if (!err && data) {
        res.locals.examId = args.examId;
        next();
        req.notify('exam-' + args.examId, {
          userId: args.userId
        });
        res.json(data);
      } else res.status(400).end();
    });
  },
  api.stopExam
);
// Exam status
router.get(
  '/status/:examId',
  function(req, res, next) {
    res.locals.examId = req.params.examId;
    next();
  },
  api.examStatus,
  function(req, res) {
    if (res.locals.examStatus) {
      res.json({
        status: res.locals.examStatus
      });
    } else res.end();
  }
);
// List all times for inspector
router.get('/schedule', function(req, res) {
  var args = {
    userId: req.user._id
  };
  db.schedule.list(args, function(err, data) {
    if (!err && data) res.json(data);
    else res.status(400).end();
  });
});
// Create time
router.post('/schedule', function(req, res) {
  var args = {
    userId: req.user._id,
    data: req.body
  };
  db.schedule.add(args, function(err, data) {
    if (!err && data) res.json(data);
    else res.status(400).end();
  });
});
// Delete time
router.delete('/schedule/:scheduleId', function(req, res) {
  var args = {
    userId: req.user._id,
    scheduleId: req.params.scheduleId
  };
  db.schedule.remove(args, function(err, data) {
    if (!err && data) res.json(data);
    else res.status(400).end();
  });
});
module.exports = router;
