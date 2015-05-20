var profile = require('./profile');
var storage = require('./storage');
var monitor = require('./monitor');
var vision = require('./vision');
var notes = require('./notes');
var chat = require('./chat');
var protocol = require('./protocol');
module.exports = function(app) {
    app.use('/profile', profile);
    app.use('/storage', profile.isAuth, storage);
    app.use('/monitor', profile.isAuth, monitor);
    app.use('/vision', profile.isAuth, vision);
    app.use('/notes', profile.isAuth, notes);
    app.use('/chat', profile.isAuth, chat);
    app.use('/protocol', profile.isAuth, protocol);
}