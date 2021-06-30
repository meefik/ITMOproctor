/**
 * Модель участников экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Member = new Schema({
  // Экзамен
  exam: {
    type: Schema.Types.ObjectId,
    ref: 'Exam'
  },
  // Пользователь
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Время подключения
  time: {
    type: Date
  },
  // IP-адрес
  ip: {
    type: String,
    required: true
  },
  // Страна
  country: {
    type: String
  },
  // Город
  city: {
    type: String
  }
});
module.exports = mongoose.model('Member', Member);
