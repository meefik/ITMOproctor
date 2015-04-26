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
var routes = require('./routes');
var profile = require('./routes/profile');
var monitor = require('./routes/api/monitor');
var vision = require('./routes/api/vision');
var notes = require('./routes/api/notes');
var pages = require('./routes/pages');
var db = require('./db');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(multer({
    dest: './uploads/',
    rename: function(fieldname, filename) {
        console.log(fieldname + "____" + filename);
        return filename;
    }
}));
app.use(cookieParser());
app.use(session({
    secret: 'cookie_secret',
    name: 'proctor',
    store: new MongoStore({
        mongooseConnection: db.connection,
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
app.use('/profile', profile);
app.use('/api/monitor', profile.isAuth, monitor);
app.use('/api/vision', profile.isAuth, vision);
app.use('/api/notes', profile.isAuth, notes);
app.use('/pages', profile.isAuth, pages);
app.use('/', routes);
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
module.exports = app;