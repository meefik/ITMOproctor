//
// exam editor view
//
define(['i18n', 'text!templates/schedule/editor.html'], function(
  i18n,
  template
) {
  console.log('views/schedule/editor.js');
  var View = Backbone.View.extend({
    initialize: function() {
      this.templates = _.parseTemplate(template);
      // Schedule model
      var Schedule = Backbone.Model.extend({
        urlRoot: 'schedule'
      });
      this.model = new Schedule();
      this.render();
    },
    destroy: function() {
      this.remove();
    },
    render: function() {
      var self = this;
      var tpl = _.template(this.templates['main-tpl']);
      var data = {
        i18n: i18n
      };
      var dialog = $(this.el).dialog({
        title: i18n.t('schedule.title'),
        width: 550,
        height: 300,
        closed: true,
        modal: true,
        content: tpl(data),
        buttons: [
          {
            text: i18n.t('schedule.save'),
            iconCls: 'fa fa-check',
            handler: function() {
              self.doSave();
            }
          },
          {
            text: i18n.t('schedule.close'),
            iconCls: 'fa fa-times',
            handler: function() {
              self.doClose();
            }
          }
        ],
        onOpen: function() {
          $(this).dialog('center');
          if (self.model.get('_id')) {
            self.model.fetch({
              success: function(model) {
                var m = model.toJSON();
                self.$From.form('load', m);
              }
            });
          }
        }
      });
      this.$Dialog = $(dialog);
      this.$From = this.$('.schedule-form');
      this.$BeginDate = this.$('.schedule-from');
      this.$EndDate = this.$('.schedule-to');
      this.$InspectorList = this.$('.inspector-list');

      this.$InspectorList.combobox({
        valueField: 'id',
        textField: 'text',
        filter: function(q, row) {
          var opts = $(this).combobox('options');
          return ~row[opts.textField].indexOf(q);
        }
      });

      var parser = function(s) {
        var t;
        if (moment(s, ['DD.MM.YYYY HH:mm:ss']).isValid()) {
          t = moment(s, 'DD.MM.YYYY HH:mm:ss').toDate();
        } else {
          t = moment(s).toDate();
        }
        if (isNaN(t)) return new Date();
        else return t;
      };
      this.$BeginDate.datetimebox({
        parser: parser,
        formatter: function(date) {
          return moment(date)
            .startOf('hour')
            .format('DD.MM.YYYY HH:mm');
        }
      });
      this.$EndDate.datetimebox({
        parser: parser,
        formatter: function(date) {
          return moment(date)
            .startOf('hour')
            .format('DD.MM.YYYY HH:mm');
        }
      });
      return this;
    },
    getInspectors: function() {
      var self = this;
      $.ajax({
        url: 'admin/users',
        data: {
          role: 2
        },
        success: function(response) {
          var inspectors = response.rows;
          if (inspectors) {
            var data = [];
            inspectors.forEach(function(item) {
              var info = '';
              info += item.lastname ? item.lastname : i18n.t('exam.unknown');
              info += ' ';
              info += item.firstname ? item.firstname + ' ' : '';
              info += item.middlename ? item.middlename + ' ' : '';
              info += '(' + item.username + ')';
              var inspector = {
                id: item._id,
                text: info
              };
              data.push(inspector);
            });
            self.$InspectorList.combobox('loadData', data);
          }
        }
      });
    },
    doSave: function() {
      var self = this;
      var config = {};
      this.$From.serializeArray().map(function(item) {
        if (config[item.name]) {
          if (typeof config[item.name] === 'string') {
            config[item.name] = [config[item.name]];
          }
          config[item.name].push(item.value);
        } else {
          if (item.name == 'beginDate' || item.name == 'endDate') {
            item.value = moment(item.value, 'DD.MM.YYYY HH:mm');
          }
          config[item.name] = item.value;
        }
      });
      this.model.save(config, {
        success: function() {
          self.doClose();
          self.callback();
        }
      });
    },
    doOpen: function(scheduleId, callback) {
      this.callback = callback;
      this.model.clear();
      if (scheduleId) this.model.set('_id', scheduleId);
      this.getInspectors();
      this.$From.form('clear');
      this.$Dialog.dialog('open');
    },
    doClose: function() {
      this.$Dialog.dialog('close');
    }
  });
  return View;
});
