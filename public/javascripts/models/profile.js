//
// Profile model
//
define([], function() {
    console.log('models/profile.js');
    var Model = Backbone.Model.extend({
        urlRoot: 'profile',
        initialize: function() {
            this.fetch({
                async: false,
                data: {
                    _: Math.random()
                }
            });
        }
    });
    return Model;
});