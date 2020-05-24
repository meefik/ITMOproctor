//
// Schedule view
//
define(['i18n', 'text!templates/schedule/planner.html'], function(
  i18n,
  template
) {
  console.log('views/schedule/planner.js');
  var View = Backbone.View.extend({
    initialize: function() {
      this.templates = _.parseTemplate(template);
      var Schedule = Backbone.Model.extend({
        urlRoot: 'inspector/schedule'
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
        height: 450,
        closed: true,
        modal: true,
        content: tpl(data),
        buttons: [
          {
            text: i18n.t('schedule.add'),
            iconCls: 'fa fa-plus',
            handler: function() {
              var beginDate = self.$BeginDate.datetimebox('getValue');
              var endDate = self.$EndDate.datetimebox('getValue');
              var concurrent = self.$Concurrent.numberspinner('getValue');
              if (beginDate && endDate && concurrent) {
                self.$Grid.datagrid('appendRow', {
                  beginDate: moment(beginDate, 'DD.MM.YYYY HH:mm'),
                  endDate: moment(endDate, 'DD.MM.YYYY HH:mm'),
                  concurrent: concurrent
                });
              }
            }
          },
          {
            text: i18n.t('schedule.remove'),
            iconCls: 'fa fa-trash-o',
            handler: function() {
              var selected = self.$Grid.datagrid('getSelected');
              if (selected) {
                var index = self.$Grid.datagrid('getRowIndex', selected);
                self.$Grid.datagrid('deleteRow', index);
              }
            }
          },
          {
            text: i18n.t('schedule.save'),
            iconCls: 'fa fa-floppy-o',
            handler: function() {
              var chengedRows = self.$Grid.datagrid('getChanges');
              chengedRows.forEach(function(element) {
                self.model.clear();
                if (element._id) {
                  var model = self.model.set(element);
                  model.destroy({
                    success: function() {
                      self.$Dialog.dialog('close');
                    }
                  });
                } else {
                  self.model.save(
                    {
                      beginDate: element.beginDate,
                      endDate: element.endDate,
                      concurrent: element.concurrent
                    },
                    {
                      success: function() {
                        self.$Dialog.dialog('close');
                      }
                    }
                  );
                }
              });
            }
          },
          {
            text: i18n.t('schedule.close'),
            iconCls: 'fa fa-times',
            handler: function() {
              self.$Dialog.dialog('close');
            }
          }
        ],
        onOpen: function() {
          $(this).dialog('center');
          self.$Grid.datagrid({
            method: 'get',
            url: 'inspector/schedule'
          });
        },
        onClose: function() {
          self.$Grid.datagrid('loadData', {
            total: 0,
            rows: []
          });
        }
      });
      this.$Dialog = $(dialog);
      this.$BeginDate = this.$('.schedule-from');
      this.$EndDate = this.$('.schedule-to');
      this.$Concurrent = this.$('.schedule-concurrent');
      this.$Grid = this.$('.schedule-table');
      this.$Grid.datagrid({
        columns: [
          [
            {
              field: 'beginDate',
              title: i18n.t('schedule.begin'),
              width: 200,
              formatter: function(val) {
                return moment(val).format('DD.MM.YYYY HH:mm');
              }
            },
            {
              field: 'endDate',
              title: i18n.t('schedule.end'),
              width: 200,
              formatter: function(val) {
                return moment(val).format('DD.MM.YYYY HH:mm');
              }
            },
            {
              field: 'concurrent',
              title: i18n.t('schedule.concurrent'),
              width: 150
            }
          ]
        ]
      });
      this.$BeginDate.datetimebox({
        formatter: function(date) {
          date = moment(date).startOf('hour');
          return date.format('DD.MM.YYYY HH:mm');
        }
      });
      this.$BeginDate.datetimebox('calendar').calendar({
        validator: function(date) {
          var now = app.now().startOf('day');
          return date >= now;
        }
      });
      this.$EndDate.datetimebox({
        formatter: function(date) {
          date = moment(date).startOf('hour');
          return date.format('DD.MM.YYYY HH:mm');
        }
      });
      this.$EndDate.datetimebox('calendar').calendar({
        validator: function(date) {
          var now = app.now().startOf('day');
          return date >= now;
        }
      });
      return this;
    },
    doOpen: function() {
      this.$Dialog.dialog('open');
    },
    doClose: function() {
      this.$Dialog.dialog('close');
    }
  });
  return View;
});
