/**
 * Модель истории входов пользователей
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user').schema;
var Logger = new Schema({
  // Идентификатор пользователя (связь N:1)
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Время входа
  time: {
    type: Date,
    default: Date.now
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
module.exports = mongoose.model('Logger', Logger);
