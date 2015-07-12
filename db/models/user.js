/**
 * Модель пользователя
 */
var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;
var Attach = require('./attach').schema;
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
        type: String
    },
    // Фамилия
    lastname: {
        type: String
    },
    // Отчество
    middlename: {
        type: String
    },
    // Пол
    gender: {
        type: String
    },
    // День рождения
    birthday: {
        type: String
    },
    // Электронная почта
    email: {
        type: String
    },
    // Роль пользователя
    role: {
        type: Number,
        default: 1
    },
    // Паспортные данные
    passport: {
        // Тип документа: паспорт, водительское удостоверение и т.п.
        doctype: {
            type: String
        },
        // Серия и номер
        number: {
            type: String
        },
        // Дата выдачи
        issueDate: {
            type: String
        },
        // Дополнительная информация
        description: {
            type: String
        }
    },
    // Связанные с пользователем файлы
    // Первый элемент массива - фотография пользователя
    attach: [Attach]
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
User.virtual('roleName').get(function() {
    var role = {
        "1": "Студент",
        "2": "Инспектор",
        "3": "Администратор"
    };
    return role[this.role];
});
User.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        delete ret.hashedPassword;
        delete ret.salt;
        return ret;
    }
});
module.exports = mongoose.model('User', User);