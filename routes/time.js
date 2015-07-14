var express = require('express');
var router = express.Router();
// Get server time
router.get('/', function(req, res) {
    var data = {
        serverTime: Date.now()
    };
    if (req.query.client) data.clientTime = parseInt(req.query.client);
    if (data.clientTime) data.diff = data.serverTime - data.clientTime;
    res.json(data);
});
module.exports = router;