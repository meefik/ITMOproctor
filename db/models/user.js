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
  // Провайдер авторизации
  provider: {
    type: String,
    required: true
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
  // Роль пользователя: 1 = Студент, 2 = Инспектор, 3 = Администратор
  role: {
    type: Number,
    default: 1
  },
  // Разрешен вход или нет
  active: {
    type: Boolean,
    default: true
  },
  // Гражданство
  citizenship: {
    type: String
  },
  // Тип документа: паспорт, свидетельство о рождении и т.п.
  documentType: {
    type: String
  },
  // Серия и номер документа
  documentNumber: {
    type: String
  },
  // Дата выдачи документа
  documentIssueDate: {
    type: String
  },
  // Адрес
  address: {
    type: String
  },
  // Дополнительная информация
  description: {
    type: String
  },
  // Связанные с пользователем файлы (фотография пользователя)
  attach: [Attach]
});
User.methods.encryptPassword = function(password, salt) {
  return crypto
    .createHmac('sha1', salt)
    .update(password)
    .digest('hex');
  //more secure - return crypto.pbkdf2Sync(password, salt, 10000, 512);
};
User.virtual('password')
  .set(function(password) {
    if (!password) password = crypto.randomBytes(8).toString('base64');
    this._plainPassword = password;
    this.salt = crypto.randomBytes(32).toString('base64');
    //more secure - this.salt = crypto.randomBytes(128).toString('base64');
    this.hashedPassword = this.encryptPassword(password, this.salt);
  })
  .get(function() {
    return this._plainPassword;
  });
User.methods.validPassword = function(password) {
  if (!password || !this.salt) return false;
  return this.encryptPassword(password, this.salt) === this.hashedPassword;
};
User.methods.isActive = function() {
  return this.active !== false;
};
User.virtual('genderId').set(function(genderId) {
  var gender = {
    m: 'Мужской',
    f: 'Женский'
  };
  this.gender = gender[genderId];
});
User.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.hashedPassword;
    delete ret.salt;
    return ret;
  }
});
User.index(
  {
    username: 1,
    provider: 1
  },
  {
    unique: true
  }
);
module.exports = mongoose.model('User', User);
