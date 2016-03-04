//
// Settings collection
//
/* global Backbone */
define([], function() {
    var Collection = Backbone.Collection.extend({
        localStorage: new Backbone.LocalStorage("settings"),
        initialize: function() {
            this.model = Backbone.Model.extend({
                idAttribute: 'name'
            });
            this.fetch();
        },
        refresh: function() {
            this.fetch({
                async: false
            });
        },
        save: function(items) {
            var self = this;
            items.forEach(function(item, i, arr) {
                var model = self.add(item, {
                    merge: true
                });
                model.save();
            });
        },
        load: function() {
            this.refresh();
            var items = {};
            this.toJSON().forEach(function(item, i, arr) {
                items[item.name] = item.value;
            });
            return items;
        }
    });
    return Collection;
});