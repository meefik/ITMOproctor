var express = require('express');
var router = express.Router();
var db = require('../db');
// Get user info by id
router.get('/:userId', function(req, res) {
  var args = {
    userId: req.params.userId
  };
  db.profile.get(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});
// Update user
router.put('/:userId', function(req, res) {
  var args = {
    userId: req.params.userId,
    data: req.body
  };
  db.profile.update(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});
// Create user
router.post('/', function(req, res) {
  var args = {
    userId: req.params.userId,
    data: req.body
  };
  db.profile.add(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});
// Delete user
router.delete('/:userId', function(req, res) {
  var args = {
    userId: req.params.userId
  };
  db.profile.remove(args, function(err, data) {
    if (!err && data) {
      res.json(data);
    } else {
      res.status(400).end();
    }
  });
});

module.exports = router;
