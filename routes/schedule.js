var express = require('express');
var router = express.Router();
var db = require('../db');
// Get schedule info by id
router.get('/:scheduleId', function(req, res) {
  var args = {
    scheduleId: req.params.scheduleId
  };
  db.schedule.get(args, function(err, data) {
    if (!err && data) res.json(data);
    else res.status(400).end();
  });
});
// Create schedule
router.post('/', function(req, res) {
  var args = {
    scheduleId: req.params.scheduleId,
    data: req.body
  };
  db.schedule.add(args, function(err, data) {
    if (!err && data) res.json(data);
    else res.status(400).end();
  });
});
// Update schedule
router.put('/:scheduleId', function(req, res) {
  var args = {
    scheduleId: req.params.scheduleId,
    data: req.body
  };
  db.schedule.update(args, function(err, data) {
    if (!err && data) res.json(data);
    else res.status(400).end();
  });
});
// Delete schedule
router.delete('/:scheduleId', function(req, res) {
  var args = {
    scheduleId: req.params.scheduleId
  };
  db.schedule.remove(args, function(err, data) {
    if (!err && data) res.json(data);
    else res.status(400).end();
  });
});
module.exports = router;
