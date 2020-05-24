//
// About view
//
define(['i18n', 'text!templates/admin/about.html'], function(i18n, template) {
  console.log('views/admin/about.js');
  var View = Backbone.View.extend({
    initialize: function() {
      // Templates
      this.templates = _.parseTemplate(template);
    },
    destroy: function() {
      this.remove();
    },
    render: function() {
      var tpl = _.template(this.templates['main-tpl']);
      var data = {
        i18n: i18n
      };
      this.$el.html(tpl(data));
      $.parser.parse(this.$el);
      return this;
    }
  });
  return View;
});
