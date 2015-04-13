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
    if(username !== "admin") {
        return done(null, false, {
            message: 'Incorrect username.'
        });
    }
    if(password !== "admin") {
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
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth'
}));
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/auth');
});
router.get('/', function(req, res) {
    req.isAuthenticated() ? res.redirect('/') : res.render('login');
});
router.checkAuth = function(req, res, next) {
    req.isAuthenticated() ? next() : res.redirect('/auth');
};
module.exports = router;