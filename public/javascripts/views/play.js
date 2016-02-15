//
// Play view
//
define([
    "i18n",
    "text!templates/play.html"
], function(i18n, template) {
    console.log('views/play.js');
    var View = Backbone.View.extend({
        initialize: function() {
            // Templates
            this.templates = _.parseTemplate(template);
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
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
        }
    });
    return View;
});