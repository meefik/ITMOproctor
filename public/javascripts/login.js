var login = new Login();

function Login() {
    this.init = function() {
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
                profile.user = data;
                loadContent('#content', '/pages/monitor');
            });
            posting.fail(function() {
                loadContent('#content', '/login');
            });
        });
        $('#username').next().find('input').focus();
    }
    this.destroy = function() {
        delete window.login;
        delete window.Login;
    }
}