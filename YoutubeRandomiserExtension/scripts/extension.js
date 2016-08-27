/// <reference path="../../jquery.d.ts"/>

console.info('script load');

var api = null;
var songs = [];
var playerBar = null;
var dom = {};

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
        console.warn('INIT: fail (too many retries)');
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

    // get DOM refs

    // get songs
    
    // create player bar

    loaded = true;
    console.log('INIT: done!');
    testEvents();
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


function testEvents() {
    //run test code here
    songStarts = getStartTimes();
    songEnds = getEndTimes(songStarts);
    console.log(songStarts);
    console.log(songEnds);
    
}

function getStartTimes() {
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
    return songStarts;
}

function getEndTimes(songStarts) {
    var songEnds = [];
    var songCount = songStarts.length;
    for (song = 0; song < songCount-1; song++) {
        songEnds[song] = songStarts[song+1];
    }
    songEnds[songCount-1] = api.getDuration();
    return songEnds;
}

function getCurrentSongIndex() {
    var currTime = api.getCurrentTime();
    for (song = 0; song < songStarts.length; song++) {
        if (currTime >= songStarts[song] && currTime <= songEnds[song]) {
            return song;
        }
    }
}

bind();
onNavigate();


