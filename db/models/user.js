/**
 * Модель пользователя
 */
var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;
var Passport = require('./passport').schema;
var User = new Schema({
    // Логин
    username: {
        type: String,
        unique: true,
        required: true
    },
    // Хэш пароля
    hashedPassword: {
        type: String,
        select: false,
        required: true
    },
    // Соль для пароля
    salt: {
        type: String,
        select: false,
        required: true
    },
    // Дата создания записи
    created: {
        type: Date,
        default: Date.now
    },
    // Имя
    firstname: {
        type: String,
    },
    // Фамилия
    lastname: {
        type: String,
    },
    // Отчество
    middlename: {
        type: String,
    },
    // Электронная почта
    email: {
        type: String,
    },
    // День рождения
    birthday: {
        type: Date
    },
    // Роль: 0 - Гость, 1 - Студент, 2 - Инспектор, 3 - Преподаватель
    role: {
        type: Number,
        default: 0
    },
    // Cсылка на файл с фотографией пользователя
    photo: {
        type: Schema.Types.ObjectId
    }
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