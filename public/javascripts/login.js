app.login = {
    init: function() {
        // Attach a submit handler to the form
        $('#login-form').submit(function(event) {
            // Stop form from submitting normally
            event.preventDefault();
            // Get some values from elements on the page:
            var $form = $(this),
                username = $form.find("input[name='username']").val(),
                password = $form.find("input[name='password']").val(),
                url = $form.attr("action");
            // Send the data using post
            var posting = $.post(url, {
                username: username,
                password: password
            });
            //$('#login-form').trigger('reset');
            // Put the results in a div
            posting.done(function(data) {
                app.user = data;
                app.doNavigate('#');
            });
            posting.fail(function() {
                app.doNavigate('#login');
            });
        });
        $('#username').next().find('input').focus();
    },
    destroy: function() {
        delete app.login;
    }
}
