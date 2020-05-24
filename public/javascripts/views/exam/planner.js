//
// Planner view
//
define(['i18n', 'text!templates/exam/planner.html'], function(i18n, template) {
  console.log('views/exam/planner.js');
  var View = Backbone.View.extend({
    bindings: {
      '.subject': {
        observe: 'subject'
      },
      '.left-date': {
        observe: 'leftDate',
        onGet: function(val) {
          return moment(val).format('DD.MM.YYYY');
        }
      },
      '.right-date': {
        observe: 'rightDate',
        onGet: function(val) {
          return moment(val).format('DD.MM.YYYY');
        }
      },
      '.duration': {
        observe: 'duration'
      }
    },
    initialize: function() {
      this.templates = _.parseTemplate(template);
      this.model = new Backbone.Model();
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
        title: i18n.t('planner.title'),
        width: 550,
        height: 450,
        closed: true,
        modal: true,
        content: tpl(data),
        buttons: [
          {
            text: i18n.t('planner.refresh'),
            iconCls: 'fa fa-refresh',
            handler: function() {
              self.$PlanGrid.datagrid('reload');
            }
          },
          {
            text: i18n.t('planner.select'),
            iconCls: 'fa fa-check',
            handler: function() {
              var selected = self.$PlanGrid.datagrid('getSelected');
              if (selected) {
                self.$Dialog.dialog('close');
                self.callback(selected);
              }
            }
          },
          {
            text: i18n.t('planner.close'),
            iconCls: 'fa fa-times',
            handler: function() {
              self.$Dialog.dialog('close');
            }
          }
        ],
        onOpen: function() {
          $(this).dialog('center');
          self.$PlanGrid.datagrid({
            method: 'get',
            url: 'student/schedule',
            queryParams: {
              leftDate: self.model.get('leftDate'),
              rightDate: self.model.get('rightDate'),
              duration: self.model.get('duration')
            }
          });
        },
        onClose: function() {
          self.$PlanGrid.datagrid('loadData', {
            total: 0,
            rows: []
          });
        }
      });
      this.$Dialog = $(dialog);
      this.$PlanGrid = this.$('.plan-table');
      this.$PlanGrid.datagrid({
        columns: [
          [
            {
              field: 'date',
              title: i18n.t('planner.date'),
              width: 200,
              formatter: function(val, row) {
                return moment(row).format('DD.MM.YYYY');
              }
            },
            {
              field: 'time',
              title: i18n.t('planner.time'),
              width: 200,
              formatter: function(val, row) {
                return moment(row).format('HH:mm');
              }
            }
          ]
        ]
      });
      this.stickit();
      return this;
    },
    doOpen: function(exam, callback) {
      this.callback = callback;
      this.model.clear().set(exam);
      this.$Dialog.dialog('open');
    },
    doClose: function() {
      this.$Dialog.dialog('close');
    }
  });
  return View;
});
