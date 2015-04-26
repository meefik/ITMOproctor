/**
 * Модель пользователя
 */
var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;
var Passport = require('./passport').schema;
var User = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    firstname: {
        type: String,
    },
    lastname: {
        type: String,
    },
    middlename: {
        type: String,
    },
    email: {
        type: String,
    },
    birthday: {
        type: Date
    },
    role: {
        type: Number,
        default: 0
    },
    passport: {
        type: Schema.Types.ObjectId,
        ref: 'Passport'
    },
    photo: [Schema.Types.ObjectId],
    diplom: [Schema.Types.ObjectId]
});
User.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    //more secure - return crypto.pbkdf2Sync(password, this.salt, 10000, 512);
};
User.virtual('password').set(function(password) {
    this._plainPassword = password;
    this.salt = crypto.randomBytes(32).toString('base64');
    //more secure - this.salt = crypto.randomBytes(128).toString('base64');
    this.hashedPassword = this.encryptPassword(password);
}).get(function() {
    return this._plainPassword;
});
User.methods.validPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};
User.set('toJSON', {
    transform: function(doc, ret, options) {
        delete ret.hashedPassword;
        delete ret.salt;
        return ret;
    }
});
module.exports = mongoose.model('User', User);