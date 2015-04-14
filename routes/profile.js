var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(function(username, password, done) {
    var user = {
        "username": "admin"
    };
    /*
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
    */
    if(username !== "demo") {
        return done(null, false, {
            message: 'Incorrect username.'
        });
    }
    if(password !== "demo") {
        return done(null, false, {
            message: 'Incorrect password.'
        });
    }
    return done(null, user);
}));
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});
router.get('/', function(req, res) {
    req.isAuthenticated() ? res.json(req.user) : res.status(401).end();
});
router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if(err) return next(err);
        if(!user) return res.status(401).end();
        req.logIn(user, function(err) {
            if(err) return next(err);
            return res.json(user);
        });
    })(req, res, next);
});
router.get('/logout', function(req, res) {
    req.logout();
    res.status(200).end();
});
router.isAuth = function(req, res, next) {
    req.isAuthenticated() ? next() : res.status(401).end();
};
module.exports = router;