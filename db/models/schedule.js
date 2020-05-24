/**
 * Модель рабочего расписания инспекторов
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user').schema;
var Schedule = new Schema({
  // Инспектор
  inspector: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Время начала работы
  beginDate: {
    type: Date,
    required: true
  },
  // Время окончания работы
  endDate: {
    type: Date,
    required: true
  },
  // Число одновременных сессий прокторинга
  concurrent: {
    type: Number,
    default: 1
  }
});
module.exports = mongoose.model('Schedule', Schedule);
