var express = require('express');
var router = express.Router();
var geoip = require('geoip-lite');

// Generate 1 MB buffer
var buffer = 'x';
for (var i = 0; i < 20; i++) {
    buffer += buffer;
}

// Get server time
router.get('/time', function(req, res) {
    var data = {
        serverTime: Date.now()
    };
    if (req.query.client) data.clientTime = parseInt(req.query.client);
    if (data.clientTime) data.diff = data.serverTime - data.clientTime;
    res.json(data);
});
// Get ip info
router.get('/ip', function(req, res) {
    var ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var geo = geoip.lookup(ip);
    var data = {
        ip: ip,
        country: geo.country,
        city: geo.city
    };
    res.json(data);
});
// Ping request
router.get('/ping', function(req, res) {
    res.end();
});
// Speed test for get data
router.post('/rx', function(req, res) {
    res.set('Content-Type', 'application/octet-stream');
    res.send(buffer);
});
// Speed test for post data
router.post('/tx', function(req, res) {
    res.end();
});
module.exports = router;