var PORT = process.env.PORT || 3000;
var HOST = process.env.HOST || '0.0.0.0';
var CONFIG = process.env.CONFIG || 'config.json';
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var config = require('nconf').file(CONFIG);
var logger = require('./common/logger');
var db = require('./db');
var MongoStore = require('connect-mongo');
var mongoStore = MongoStore.create({
  clientPromise: new Promise(function(resolve) {
    resolve(db.mongoose.connection.getClient());
  }),
  ttl: config.get('cookie:ttl') * 24 * 60 * 60 // days
});
var app = express();
var protocol = config.get('ssl') ? 'https' : 'http';
var server;
if (protocol === 'https') {
  var fs = require('fs');
  var options = {
    key: fs.readFileSync(config.get('ssl:key')),
    cert: fs.readFileSync(config.get('ssl:cert'))
  };
  server = require(protocol).Server(options, app);
} else {
  server = require(protocol).Server(app);
}
var io = require('socket.io')(server);
var passportSocketIo = require('passport.socketio');
var notify = io.of('/notify');
app.enable('trust proxy');
app.disable('x-powered-by');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(path.join(__dirname, 'public/images/favicon.png')));
app.use(
  morgan('short', {
    stream: logger.stream
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    name: 'proctor',
    secret: config.get('cookie:secret'),
    store: mongoStore,
    proxy: true,
    resave: true,
    saveUninitialized: true,
    cookie: {
      session: false,
      maxAge: config.get('cookie:ttl') * 24 * 60 * 60 * 1000 // days
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
// notifications
app.use(function(req, res, next) {
  req.notify = function(target, data) {
    notify.emit(target, data);
  };
  next();
});
// socket.io authorization
io.use(
  passportSocketIo.authorize({
    passport: passport,
    cookieParser: cookieParser,
    key: 'proctor',
    secret: config.get('cookie:secret'),
    store: mongoStore,
    success: function(data, accept) {
      accept();
    },
    fail: function(data, message, error, accept) {
      if (error) accept(new Error(message));
    }
  })
);
// routing
require('./routes')(app);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// error handlers
if (config.get('logger:level') === 'debug') {
  // development error handler
  // will print stacktrace
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
} else {
  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {
        status: err.status
      }
    });
  });
}
// webrtc
var webcall = require('./common/webcall');
webcall(io, ['/webcall']);
// start server
server.listen(PORT, HOST, function() {
  var address = server.address();
  logger.info('Server listening on ' + address.address + ':' + address.port);
});
