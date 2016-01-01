var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var IfmoSSOStrategy = require('passport-ifmosso').Strategy;
var config = require('nconf');
var db = require('../db');

function checkRole(req, res, next, role) {
    if (req.isAuthenticated()) {
        if (!role || req.user.role >= role) next();
        else res.status(403).end();
    }
    else {
        res.status(401).end();
    }
}

router.isAuth = function(req, res, next) {
    checkRole(req, res, next);
};
router.isStudent = function(req, res, next) {
    checkRole(req, res, next, 1);
};
router.isInspector = function(req, res, next) {
    checkRole(req, res, next, 2);
};
router.isAdministrator = function(req, res, next) {
    checkRole(req, res, next, 3);
};
router.isMyself = function(req, res, next) {
    if (req.params.userId === req.user._id) next();
    else res.status(403).end();
};
router.isInspectorOrMyself = function(req, res, next) {
    if (req.user.role > 1 || req.params.userId === req.user._id) next();
    else res.status(403).end();
};
router.logUserIP = function(req, res, next) {
    if (req.isAuthenticated()) {
        db.profile.log({
            userId: req.user._id,
            ip: req.ip
        });
    }
    next();
};

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

// Local strategy
passport.use('local', new LocalStrategy(db.profile.auth.local));
router.post('/login', passport.authenticate('local', {
    failureRedirect: '/#login'
}), router.logUserIP, function(req, res, next) {
    res.json(req.user);
});

// IfmoSSO strategy
passport.use('ifmosso', new IfmoSSOStrategy({
    secretKey: config.get('auth:ifmosso:secretKey')
}, db.profile.auth.ifmosso));
router.post('/ifmosso/callback', passport.authenticate('ifmosso', {
    failureRedirect: '/#login'
}), router.logUserIP, function(req, res, next) {
    res.redirect('/');
});

// OAuth2 strategy (openedu)
passport.use('openedu', new OAuth2Strategy({
    authorizationURL: config.get('auth:openedu:authorizationURL'),
    tokenURL: config.get('auth:openedu:tokenURL'),
    clientID: config.get('auth:openedu:clientID'),
    clientSecret: config.get('auth:openedu:clientSecret'),
    callbackURL: config.get('auth:openedu:callbackURL')
}, function(accessToken, refreshToken, prof, done) {
    var userProfileURL = config.get('auth:openedu:userProfileURL');
    this._oauth2._useAuthorizationHeaderForGET = true;
    this._oauth2.get(userProfileURL, accessToken, function(err, body, res) {
        if (err) {
            var InternalOAuthError = require('passport-oauth').InternalOAuthError;
            return done(new InternalOAuthError('failed to fetch user profile', err));
        }
        try {
            db.profile.auth.openedu(JSON.parse(body), done);
        }
        catch (e) {
            done(e);
        }
    });
}));
router.get('/openedu', passport.authenticate('openedu'));
router.get('/openedu/callback', passport.authenticate('openedu', {
    failureRedirect: '/#login'
}), router.logUserIP, function(req, res, next) {
    res.redirect('/');
});

// Get user profile
router.get('/', function(req, res) {
    req.isAuthenticated() ? res.json(req.user) : res.status(401).end();
});
// User logout
router.get('/logout', function(req, res) {
    req.logout();
    res.end();
});
// Get user profile by id
router.get('/:userId', router.isInspectorOrMyself, function(req, res) {
    var args = {
        userId: req.params.userId
    };
    db.profile.info(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Update user profile by id
router.put('/:userId', router.isMyself, function(req, res) {
    var args = {
        userId: req.params.userId,
        data: {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            middlename: req.body.middlename,
            gender: req.body.gender,
            birthday: req.body.birthday,
            email: req.body.email,
            citizenship: req.body.citizenship,
            documentType: req.body.documentType,
            documentNumber: req.body.documentNumber,
            documentIssueDate: req.body.documentIssueDate,
            address: req.body.address,
            description: req.body.description,
            attach: req.body.attach
        }
    };
    db.profile.update(args, function(err, data) {
        if (!err && data) {
            req.login(data, function(error) {
                if (error) res.status(400).end();
                else res.json(data);
            });
        }
        else {
            res.status(400).end();
        }
    });
});

module.exports = router;