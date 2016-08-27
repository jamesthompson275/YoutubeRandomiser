/// <reference path="../../jquery.d.ts"/>

console.info('script load');

//TODO...
//YoutubeRandomiserExtension = {};
//YoutubeRandomiserExtension.bind();

var api = null;
var songs = [];

var dom = {
    title: null,
    description: null,
    container: null,
    playerContainer: null,
    name: null,
    prevBtn: null,
    nextBtn: null,
    loopBtn: null,
    shuffleBtn: null,
    tableContainer: null,
    table: null
};

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

function ticker(){
    if (!watch) {
        console.warn('TICK: stop (leaving page)');
        return;
    }

    window.setTimeout(ticker, 250);
}

function init(attempt = 0){
    if (!watch) {
        console.info('INIT: abort (leaving page)');
        return;
    }

    if (attempt > 10) {
        console.error('INIT: fail (too many retries)');
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

    // get DOM elements
    dom.title = $('h1.watch-title-container');
    dom.description = $('p#eow-description');

    if (
        !dom.title.length || 
        !dom.description.length
    ) {
        console.error('INIT: fail (DOM elements missing)');
        return;
    }

    // create DOM elements
    var btnStyle = 'class="yt-uix-button yt-uix-button-default yt-uix-button-size-default"';
    dom.title.after(`
        <div id="YoutubeRandomiserExtension">
            <div id="YTREPlayerContainer">
                <div style="margin: 5px;">
                    <b>Now Playing : </b>
                    <span id="YTRESongName" style="margin: 10px"> ... </span>
                </div>
                <div>
                    <button `+btnStyle+` id="YTREPrevBtn">    prev    </button>
                    <button `+btnStyle+` id="YTRENextBtn">    next    </button>
                    <button `+btnStyle+` id="YTRELoopBtn">    repeat  </button>
                    <button `+btnStyle+` id="YTREShuffleBtn"> shuffle </button>
                </div>
            </div>
            <div id="YTRETableContainer">
                <table id="YTRETable">
                </table>
            </div>
        </div>
    `);
    dom.container = $('#YoutubeRandomiserExtension');
    dom.tableContainer = $('#YTRETableContainer');
    dom.playerContainer = $('#YTREPlayerContainer');
    dom.table = $('#YTRETable');
    dom.name = $('#YTRESongName');
    dom.prevBtn= $('#YTREPrevBtn');
    dom.nextBtn= $('#YTRENextBtn');
    dom.loopBtn= $('#YTRELoopBtn');
    dom.shuffleBtn= $('#YTREShuffleBtn');

    if (
        !dom.container.length || 
        !dom.tableContainer.length || 
        !dom.playerContainer.length || 
        !dom.table.length ||
        !dom.name.length ||
        !dom.prevBtn.length ||
        !dom.nextBtn.length ||
        !dom.loopBtn.length ||
        !dom.shuffleBtn.length
    ) {
        console.error('INIT: fail (DOM create failed)');
        return;
    }

    // get songs
    songs = getSongs();

    // populate songs table
    //TODO...

    // bind songs table events
    //TODO...

    // bind normal button events
    //TODO...

    //$(div).html(s)
    //$(div).append(s)
    //$(div).before(s)
    //$(div).after(s)

    loaded = true;
    console.log('INIT: done!');
    testEvents();
    ticker();
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

    onNavigate();
}

function getSongs() {

    // populate song array
    //TODO...
}

function unsort(array) {
    var idx = array.length;
    var randomIdx;
    var temp;

    while (0 !== idx) {
        randomIdx = Math.floor(Math.random() * idx);
        idx -= 1;
        temp = array[idx];
        array[idx] = array[randomIdx];
        array[randomIdx] = temp;
    }

    return array;
}

function testEvents() {
    // run test code here
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
