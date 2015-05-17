var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var multer = require('multer');
var config = require('nconf').file('./config.json');
var profile = require('./routes/profile');
var storage = require('./routes/storage');
var monitor = require('./routes/monitor');
var vision = require('./routes/vision');
var notes = require('./routes/notes');
var chat = require('./routes/chat');
var protocol = require('./routes/protocol');
var db = require('./db');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
app.set('io:notify', io.of('/notify'));
app.set('io:call', io.of('/call'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(path.join(__dirname, 'public/images/favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(multer({
    dest: './uploads/',
    /*
    rename: function(fieldname, filename) {
        console.log(fieldname + "____" + filename);
        return filename;
    }
    */
    limits: {
        fileSize: 10 * 1024 * 1024, // at most 10MB
    },
    // setting attributes of `file` is useful for passing info to the
    // next middleware
    onFileSizeLimit: function(file) {
        fs.unlink('./' + file.path); // delete the partially written file
        file.failed = true;
    }
}));
app.use(cookieParser());
app.use(session({
    secret: 'cookie_secret',
    name: 'proctor',
    store: new MongoStore({
        mongooseConnection: db.mongoose.connection,
        ttl: 14 * 24 * 60 * 60 // = 14 days. Default 
    }),
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
/*app.use(function(req, res, next) {
    req.db = db;
    next();
});*/
// Notifications
app.use(function(req, res, next) {
    req.notify = function(target) {
        var examId = req.user.examId;
        var userId = req.user._id;
        var out = {
            examId: examId,
            userId: userId
        };
        var io = req.app.get('io:notify');
        io.emit(target + '-' + examId, out);
    }
    next();
});
app.use('/profile', profile);
app.use('/storage', profile.isAuth, storage);
app.use('/monitor', profile.isAuth, monitor);
app.use('/vision', profile.isAuth, vision);
app.use('/notes', profile.isAuth, notes);
app.use('/chat', profile.isAuth, chat);
app.use('/protocol', profile.isAuth, protocol);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if(app.get('env') === 'development') {
    db.mongoose.set('debug', true);
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
var webrtc = require('./webrtc')(app);
module.exports = server;