//
// Internationalization
//
define(['replace!locale', 'replace!easyui'], function(locale, easyui) {
  console.log('i18n.js');
  var polyglot = new Polyglot({
    phrases: locale
  });
  _.extend($, easyui);
  moment.locale(LANG);
  return polyglot;
});
