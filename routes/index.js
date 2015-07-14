var profile = require('./profile');
var passport = require('./passport');
var storage = require('./storage');
var exam = require('./exam');
var student = require('./student');
var inspector = require('./inspector');
var notes = require('./notes');
var chat = require('./chat');
var protocol = require('./protocol');
var tools = require('./tools');
module.exports = function(app) {
    app.use('/profile', profile);
    app.use('/passport', profile.isInspector, passport);
    app.use('/storage', profile.isAuth, storage);
    app.use('/exam', profile.isStudent, exam);
    app.use('/student', profile.isStudent, student);
    app.use('/inspector', profile.isInspector, inspector);
    app.use('/notes', profile.isInspector, notes);
    app.use('/chat', profile.isStudent, chat);
    app.use('/protocol', profile.isInspector, protocol);
    app.use('/tools', profile.isStudent, tools);
}