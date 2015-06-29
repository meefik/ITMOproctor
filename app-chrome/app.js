var webview = document.getElementById('proctor-app');
webview.addEventListener('permissionrequest', function(e) {
	console.log('permissionrequest');
	console.log(e);
	if (e.permission === 'media') {
		e.request.allow();
	}
});
document.addEventListener('DOMContentLoaded', function() {
	console.log('docutemt loaded');
});
