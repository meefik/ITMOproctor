var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var config = require('nconf')
var db = require('../db');

function authCallback(strategy, req, res, next) {
    passport.authenticate(strategy, function(err, user, info) {
        if (err) return next(err);
        if (!user) return res.status(401).end();
        req.logIn(user, function(err) {
            if (err) return next(err);
            db.profile.log({
                userId: user._id,
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
            });
            return res.json(user);
        });
    })(req, res, next);
}

function checkAccess(req, res, next, role) {
    if (req.isAuthenticated()) {
        if (!role || req.user.role >= role) next()
        else res.status(403).end();
    }
    else {
        res.status(401).end();
    }
};

passport.use('local', new LocalStrategy(db.profile.auth.local));
passport.use('openedu', new OAuth2Strategy({
    authorizationURL: config.get('auth:openedu:authorizationURL'),
    tokenURL: config.get('auth:openedu:tokenURL'),
    clientID: config.get('auth:openedu:clientID'),
    clientSecret: config.get('auth:openedu:clientSecret'),
    callbackURL: config.get('auth:openedu:callbackURL')
}, db.profile.auth.oauth2));
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
    authCallback('local', req, res, next);
});
router.get('/openedu', passport.authenticate('openedu'));
router.get('/openedu/callback', function(req, res, next) {
    authCallback('openedu', req, res, next);
});
router.get('/logout', function(req, res) {
    req.logout();
    res.end();
});

router.isAuth = function(req, res, next) {
    checkAccess(req, res, next);
};
router.isStudent = function(req, res, next) {
    checkAccess(req, res, next, 1);
};
router.isInspector = function(req, res, next) {
    checkAccess(req, res, next, 2);
};
router.isAdministrator = function(req, res, next) {
    checkAccess(req, res, next, 3);
};
module.exports = router;