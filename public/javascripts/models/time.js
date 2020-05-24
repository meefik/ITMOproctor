//
// Time model
//
define([], function() {
  console.log('models/time.js');
  var Model = Backbone.Model.extend({
    urlRoot: 'tools/time',
    defaults: {
      deviation: 10000 // milliseconds
    },
    initialize: function() {
      var self = this;
      this._ticker = Date.now();
      this._timer = setInterval(function() {
        self.onTick();
      }, 1000);
    },
    destroy: function() {
      clearInterval(this._timer);
    },
    syncTime: function() {
      var self = this;
      var clientTime = Date.now();
      this.fetch({
        data: {
          client: clientTime
        },
        success: function(model) {
          self._ticker = model.get('serverTime');
          self._lastSync = self._ticker;
          console.log('Time diff: ' + model.get('diff') + ' ms');
        }
      });
    },
    onTick: function() {
      this._ticker += 1000;
      this.set('time', this._ticker);
      if (this._lastSync) {
        var diff = Math.abs(Date.now() + this.get('diff') - this.get('time'));
        if (diff > this.get('deviation')) this.syncTime();
      }
    },
    stop: function() {
      this._lastSync = null;
    },
    now: function() {
      return moment(this._ticker);
    }
  });
  return Model;
});
