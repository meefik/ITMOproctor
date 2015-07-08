var NwBuilder = require('node-webkit-builder');
var nw = new NwBuilder({
    files: './app-nw/**', // use the glob format
    platforms: ['linux32', 'linux64', 'win32', 'win64'],
    version: '0.12.2'
});

//Log stuff you want
nw.on('log',  console.log);

// Build returns a promise
nw.build().then(function () {
    console.log('all done!');
}).catch(function (error) {
    console.error(error);
});