var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var multer = require('multer');
var fs = require('fs');
var config = require('nconf').file('./config.json');
var logger = require('./common/logger');
var db = require('./db');
var MongoStore = require('connect-mongo')(session);
var mongoStore = new MongoStore({
    mongooseConnection: db.mongoose.connection,
    ttl: config.get("cookie:ttl") * 24 * 60 * 60 // days
});
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var passportSocketIo = require("passport.socketio");
var notify = io.of('/notify');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(path.join(__dirname, 'public/images/favicon.png')));
app.use(morgan("short", {
    "stream": logger.stream
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
// uploads
app.use(multer({
    dest: './uploads/',
    limits: {
        fileSize: config.get("upload:limit") * 1024 * 1024, // MB
    },
    onFileSizeLimit: function(file) {
        fs.unlink('./' + file.path); // delete the partially written file
        file.failed = true;
    }
}));
app.use(cookieParser());
app.use(session({
    name: 'proctor',
    secret: config.get("cookie:secret"),
    store: mongoStore,
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
// notifications
app.use(function(req, res, next) {
    req.notify = function(target) {
        var userId = req.user._id;
        var out = {
            userId: userId
        };
        notify.emit(target, out);
    };
    next();
});
// socket.io authorization
io.use(passportSocketIo.authorize({
    passport: passport,
    cookieParser: cookieParser,
    key: 'proctor',
    secret: config.get("cookie:secret"),
    store: mongoStore,
    success: function(data, accept) {
        accept();
    },
    fail: function(data, message, error, accept) {
        if (error) accept(new Error(message));
    }
}));
// routing
require('./routes')(app);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
if (config.get("logger:level") === 'debug') {
    // development error handler
    // will print stacktrace
    db.mongoose.set('debug', logger.db);
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
else {
    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}
// webrtc
require('./webrtc')(io);
module.exports = server;