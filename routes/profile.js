var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var db = require('../db');
passport.use(new LocalStrategy(db.profile.auth));
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
        if (err) return next(err);
        if (!user) return res.status(401).end();
        req.logIn(user, function(err) {
            if (err) return next(err);
            return res.json(user);
        });
    })(req, res, next);
});
router.get('/logout', function(req, res) {
    req.logout();
    res.end();
});

function checkAccess(req, res, next, role) {
    if (req.isAuthenticated()) {
        if (!role || req.user.role >= role) next()
        else res.status(403).end();
    }
    else {
        res.status(401).end();
    }
};
router.isAuth = function(req, res, next) {
    checkAccess(req, res, next);
};
router.isStudent = function(req, res, next) {
    checkAccess(req, res, next, 1);
};
router.isInspector = function(req, res, next) {
    checkAccess(req, res, next, 2);
};
module.exports = router;