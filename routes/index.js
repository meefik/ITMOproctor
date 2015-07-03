var profile = require('./profile');
var passport = require('./passport');
var storage = require('./storage');
var exam = require('./exam');
var student = require('./student');
var inspector = require('./inspector');
var notes = require('./notes');
var chat = require('./chat');
var protocol = require('./protocol');
module.exports = function(app) {
    app.use('/profile', profile);
    app.use('/passport', profile.isAuth, passport);
    app.use('/storage', profile.isAuth, storage);
    app.use('/exam', profile.isAuth, exam);
    app.use('/student', profile.isAuth, student);
    app.use('/inspector', profile.isAuth, inspector);
    app.use('/notes', profile.isAuth, notes);
    app.use('/chat', profile.isAuth, chat);
    app.use('/protocol', profile.isAuth, protocol);
}