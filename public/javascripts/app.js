//
// Global variables
//
var LANG = 'ru';
var SINGLE_MODE = false;
var UPLOAD_LIMIT = 10; // MB
var TX_MIN = 1; // Mbps
var RX_MIN = 1; // Mbps
var REQUEST_INTERVAL = 60; // seconds

//
// Loading progress
//
$.messager.progress({
  onClose: function() {}
});

//
// RequireJS config
//
require.config({
  config: {
    replace: {
      pattern: 'LANG',
      value: function() {
        return LANG;
      }
    }
  },
  paths: {
    replace: '../bower_components/require.replace/require.replace',
    text: '../bower_components/text/text',
    locale: 'locales/LANG',
    easyui: '../bower_components/jeasyui/locale/easyui-lang-LANG'
  },
  shim: {
    easyui: {
      exports: '$'
    }
  }
});

//
// Backbone config
//
Backbone.Model.prototype.idAttribute = '_id';

//
// Underscore extends
//
_.mixin({
  parseTemplate: function(template) {
    var $div = $('<div></div>').html(template);
    var templates = {};
    var scripts = $div.find('script[type="text/template"]');
    for (var i = 0, l = scripts.length; i < l; i++) {
      var id = scripts[i].id;
      templates[id] = $(scripts[i]).html();
    }
    return templates;
  },
  postMessage: function(message, targetOrigin, transfer) {
    var win = window.win || window;
    win.window.postMessage(message, targetOrigin, transfer);
  },
  truncateFilename: function(filename, length) {
    var extension = filename.indexOf('.') > -1 ? filename.split('.').pop() : '';
    if (filename.length > length) {
      filename =
        filename.substring(0, length - extension.length) + '...' + extension;
    }
    return filename;
  },
  isHttpStatusOK: function(url) {
    var status;
    $.ajax({
      url: url,
      type: 'HEAD',
      async: false,
      error: function() {
        status = false;
      },
      success: function() {
        status = true;
      }
    });
    return status;
  },
  dataUrlToFile: function(dataUrl, filename, type) {
    var blobBin = atob(dataUrl.split(',')[1]);
    var array = [];
    for (var i = 0, l = blobBin.length; i < l; i++) {
      array.push(blobBin.charCodeAt(i));
    }
    return new File([new Uint8Array(array)], filename, {
      type: type
    });
  },
  textSearch: function(data, text) {
    if (!data || !(text || '').length) return data;
    var objectToString = function(obj) {
      var result = '';
      if (obj instanceof Array) {
        for (var i = 0; i < obj.length; i++) {
          result += objectToString(obj[i]);
        }
      } else {
        for (var prop in obj) {
          if (obj[prop] instanceof Object || obj[prop] instanceof Array) {
            result += objectToString(obj[prop]);
          }
          if (typeof obj[prop] === 'string') result += obj[prop] + ' ';
        }
      }
      return result;
    };
    var phrases = text.toLowerCase().split(' ');
    var rows = [];
    for (var i = 0, li = data.length; i < li; i++) {
      var str = objectToString(data[i]).toLowerCase();
      var cond = true;
      for (var j = 0, lj = phrases.length; j < lj; j++) {
        if (str.search(phrases[j]) === -1) {
          cond = false;
          break;
        }
      }
      if (cond) rows.push(data[i]);
    }
    return rows;
  },
  // Generate a RFC4122 v4 (random) id
  uuid: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
  progressMessager: function(msg, total, callback) {
    var messager = $.messager.progress({
      msg: msg,
      interval: 0
    });
    var $progress = $(messager).find('.progressbar');
    var loaded = 0;
    return function() {
      loaded++;
      var percentage = Math.floor((loaded / total) * 100);
      $progress.progressbar('setValue', percentage);
      if (loaded === total) {
        $.messager.progress('close');
        if (callback) callback();
      }
    };
  }
});

//
// jQuery extends
//
$.fn.serializeObject = function() {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function() {
    if (o[this.name] !== undefined) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || '');
    } else {
      o[this.name] = this.value || '';
    }
  });
  return o;
};
$.extend($.fn.progressbar.methods, {
  setColor: function(jq, color) {
    var pb = jq.find('.progressbar-value > .progressbar-text');
    var defaultColor = $.data(jq[0], 'progressbar').options.color;
    if (!defaultColor) {
      defaultColor = pb.css('backgroundColor');
      $.data(jq[0], 'progressbar').options.color = defaultColor;
    }
    if (color) {
      pb.css({
        backgroundColor: color
      });
    } else {
      pb.css({
        backgroundColor: defaultColor
      });
    }
  }
});

//
// Application
//
require([
  'router',
  'models/profile',
  'models/time',
  'collections/settings'
], function(Router, ProfileModel, TimeModel, Settings) {
  console.log('app.js');
  // app
  window.app = {
    profile: new ProfileModel(),
    time: new TimeModel(),
    settings: new Settings(),
    router: new Router(),
    login: function(username, password, error) {
      var self = this;
      this.profile.clear().save(
        {
          username: username,
          password: password
        },
        {
          success: function() {
            self.time.syncTime();
            self.connect();
            self.router.navigate('', {
              trigger: true
            });
          },
          error: error
        }
      );
    },
    logout: function() {
      var self = this;
      _.postMessage('clearCookies', '*');
      this.profile.destroy({
        success: function(model) {
          model.clear();
          self.time.stop();
          self.disconnect();
          self.router.navigate('login', {
            trigger: true
          });
        }
      });
    },
    connect: function(options) {
      if (this.io) return;
      var url = window.location.host;
      this.io = {
        notify: io.connect(url + '/notify', options)
      };
    },
    disconnect: function() {
      for (var k in this.io) {
        if (this.io[k]) this.io[k].disconnect();
      }
      this.io = null;
    },
    isAuth: function() {
      return this.profile.has('username');
    },
    isRole: function(role) {
      return this.profile.get('role') === role;
    },
    isMe: function(id) {
      return this.profile.get('_id') === id;
    },
    now: function() {
      return this.time.now();
    }
  };
  // starting
  $(document).ready(function() {
    console.log('ready');
    if (app.isAuth()) {
      app.time.syncTime();
      app.connect();
    }
    Backbone.history.start();
  });
});
