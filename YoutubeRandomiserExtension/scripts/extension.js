/// <reference path="../../jquery.d.ts"/>

console.info('script load');

var api = null;
var description = null;
var songs = [];
var playerBar = null;

var loaded = false;
var watch = false;

function onNavigate() {
    watch = ('/watch' === location.pathname);

    if (watch) {
        console.log('NAV: watch page!');
        init();
        return;
    }
    console.log('NAV: non-watch page')
    destroy();
}

function init(attempt = 0){
    if (!watch) {
        console.warn('INIT: abort (leaving page)');
        return;
    }

    if (attempt > 10) {
        console.warn('INIT: abort (too many retries)');
        return;
    }

    // get player
    var _api = document.getElementById('movie_player');
    if (_api.getCurrentTime === undefined) {
        window.setTimeout(init, 1000, attempt++);
        console.warn('INIT: retry (player not found)');
        return;
    }
    api = _api;

    // get description

    // get songs
    
    // create player bar

    loaded = true;
    console.log('INIT: done!');
}

function destroy() {}

function bind() {
    (document.body || document.documentElement).addEventListener(
        'transitionend',
        function(event) {
            if (event.propertyName === 'width' && event.target.id === 'progress') {
                onNavigate();
            }
        }, 
        true);
}


bind();
onNavigate();

    
    //window.setTimeout(checkNavigation, 5000);
    checkNavigation();

var songCount = $('#eow-description a[href="#"]').length;
var songStarts = [];
for (song = 0; song < songCount; song++) {
    var timeSplit = $('#eow-description a[href="#"]')[song].text.split(":");
    var timeSplitLen = timeSplit.length;
    var startTime = 0
    for (i = 0; i < timeSplitLen; i++) {
        startTime += parseInt(timeSplit[i])*Math.pow(60,timeSplitLen-1-i);
    }
    songStarts[song] = startTime;
}
