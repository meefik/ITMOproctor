var express = require('express');
var router = express.Router();
// File upload
router.post('/', function(req, res) {
    console.log(req.files);
    res.json(req.files);
});
module.exports = router;