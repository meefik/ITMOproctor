//
// Settings view
//
define(['i18n', 'text!templates/settings.html'], function(i18n, template) {
  console.log('views/settings.js');
  var View = Backbone.View.extend({
    initialize: function() {
      var self = this;
      // Templates
      this.templates = _.parseTemplate(template);
      // Events
      this.eventHandler = function(event) {
        var message = event.data;
        switch (message.id) {
        case 'sourceId':
          if (message.data) {
            self.$ScreenId.textbox('setValue', message.data);
          }
          break;
        case 'version':
          self.$Version.text(
            message.data.version +
                ' [' +
                message.data.engine +
                '/' +
                message.data.release +
                ']'
          );
          self.doUpdate(message.data);
          break;
        }
      };
      window.addEventListener('message', this.eventHandler);
      this.render();
    },
    destroy: function() {
      window.removeEventListener('message', this.eventHandler);
      this.remove();
    },
    render: function() {
      var self = this;
      var tpl = _.template(this.templates['main-tpl']);
      var data = {
        i18n: i18n
      };
      var dialog = $(this.el).dialog({
        title: i18n.t('settings.title'),
        width: 500,
        height: 400,
        closed: true,
        modal: true,
        content: tpl(data),
        onOpen: function() {
          $(this).dialog('center');
        },
        buttons: [
          {
            text: i18n.t('settings.save'),
            iconCls: 'fa fa-check',
            handler: function() {
              self.doSave();
            }
          },
          {
            text: i18n.t('settings.close'),
            iconCls: 'fa fa-times',
            handler: function() {
              self.doClose();
            }
          }
        ]
      });
      this.$Dialog = $(dialog);
      this.$ScreenBtn = this.$('.screen-btn');
      this.$WebcameraAudio = this.$('.webcamera-audio');
      this.$WebcameraVideo = this.$('.webcamera-video');
      this.$SettingsForm = this.$('.settings-form');
      this.$ScreenId = this.$('.screen-id');
      this.$Version = this.$('.app-version');
      this.$Update = this.$('.app-update');
      this.$Dist = this.$('.app-dist');
      this.$ScreenBtn.click(function() {
        _.postMessage('chooseSourceId', '*');
      });
      _.postMessage('getVersion', '*');
      return this;
    },
    getMediaSources: function(kind, callback) {
      navigator.mediaDevices
        .enumerateDevices()
        .then(function(devices) {
          var mediaSources = [];
          for (var i = 0, l = devices.length; i < l; i++) {
            var device = devices[i];
            if (device.kind == kind) {
              var n = mediaSources.length + 1;
              mediaSources.push({
                name: device.deviceId,
                value:
                  device.label ||
                  i18n.t('settings.webcamera.unknown', {
                    num: n
                  })
              });
            }
          }
          if (callback) callback(mediaSources);
        })
        .catch(function(err) {
          console.log(err.name + ': ' + err.message);
        });
    },
    updateMediaSources: function() {
      var self = this;
      this.getMediaSources('audioinput', function(sources) {
        self.$WebcameraAudio.combobox('loadData', sources);
        var model = app.settings.get('webcamera-audio');
        if (model)
          self.$WebcameraAudio.combobox('setValue', model.get('value'));
      });
      this.getMediaSources('videoinput', function(sources) {
        self.$WebcameraVideo.combobox('loadData', sources);
        var model = app.settings.get('webcamera-video');
        if (model)
          self.$WebcameraVideo.combobox('setValue', model.get('value'));
      });
    },
    doOpen: function() {
      this.$SettingsForm.form('load', app.settings.load());
      this.updateMediaSources();
      this.$Dialog.dialog('open');
    },
    doSave: function() {
      var formData = this.$SettingsForm.serializeArray();
      app.settings.save(formData);
      this.doClose();
    },
    doClose: function() {
      this.$Dialog.dialog('close');
    },
    doUpdate: function(app) {
      var self = this;
      $.getJSON('dist/metadata.json', function(data) {
        if (!data) return;
        if (app.engine == 'node-webkit') {
          if (data.version != app.version) {
            self.$Update.html(
              i18n.t('settings.app.update') +
                ': ' +
                data.version +
                ' (' +
                moment(data.date).format('YYYY.MM.DD HH:mm:ss') +
                ')'
            );
            for (var k in data.md5) {
              self.$Dist.append(
                '<li><a href="dist/' +
                  k +
                  '" title="md5: ' +
                  data.md5[k] +
                  '">' +
                  k +
                  '</a></li>'
              );
            }
          }
        }
      });
    }
  });
  return View;
});
