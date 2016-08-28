/// <reference path="../../jquery.d.ts"/>

console.info('script load');

//TODO...
//YoutubeRandomiserExtension = {};
//YoutubeRandomiserExtension.bind();

var api = null;
var songs = [];
var wasPlaying = -1;
var wasTime = -1;

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
    disableBtn: null,
    tableContainer: null,
    table: null
};

var loaded = false;
var watch = false;

function onNavigate() {
    watch = ('/watch' === location.pathname);

    if (watch) {
        console.log('YTRE NAV: watch page!');
        init();
        return;
    }
    console.log('YTRE NAV: non-watch page')
    destroy();
}

function ticker(){
    if (!watch) {
        console.warn('YTRE TICK: stop (leaving page)');
        return;
    }
    setNowPlaying();
    window.setTimeout(ticker, 250);
}

function init(attempt = 0){
    if (!watch) {
        console.info('YTRE INIT: abort (leaving page)');
        return;
    }

    if (attempt > 10) {
        console.error('YTRE INIT: fail (too many retries)');
        return;
    }

    // get player
    var _api = document.getElementById('movie_player');
    if (_api.getCurrentTime === undefined) {
        window.setTimeout(init, 1000, attempt++);
        console.warn('YTRE INIT: retry (player not found)');
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
        console.error('YTRE INIT: fail (DOM elements missing)');
        return;
    }

    // get songs
    songs = getSongs();
    if (!songs.length) {
        console.warn('YTRE INIT: abort (no songs in description)');
        return;
    }

    // create DOM elements
    var btnClasses = 'class="yt-uix-button yt-uix-button-default yt-uix-button-size-default"';
    dom.title.after(`
        <div id="YoutubeRandomiserExtension">
            <div id="YTREPlayerContainer">
                <div style="margin: 5px;">
                    <b>Now Playing : </b>
                    <span id="YTRESongName" style="margin: 10px"> ... </span>
                </div>
                <div>
                    <button `+btnClasses+` id="YTREPrevBtn">    prev    </button>
                    <button `+btnClasses+` id="YTRENextBtn">    next    </button>
                    <button `+btnClasses+` id="YTREShuffleBtn"> shuffle </button>
                    <button `+btnClasses+` id="YTRELoopBtn">    repeat  </button>
                    <button `+btnClasses+` id="YTREDisableBtn"> disable </button>
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
    dom.songName = $('#YTRESongName');
    dom.prevBtn = $('#YTREPrevBtn');
    dom.nextBtn = $('#YTRENextBtn');
    dom.loopBtn = $('#YTRELoopBtn');
    dom.shuffleBtn = $('#YTREShuffleBtn');
    dom.disableBtn = $('#YTREDisableBtn');

    if (
        !dom.container.length || 
        !dom.tableContainer.length || 
        !dom.playerContainer.length || 
        !dom.table.length ||
        !dom.songName.length ||
        !dom.prevBtn.length ||
        !dom.nextBtn.length ||
        !dom.loopBtn.length ||
        !dom.shuffleBtn.length
    ) {
        console.error('YTRE INIT: fail (DOM create failed)');
        return;
    }

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
    console.info('YTRE INIT: done!');
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

    // get description parts
    var s = '<p>' + dom.description[0].outerHTML.split('<br>').join('</p><p>') + '</p>';
    var d = $.parseHTML(s);
    var duration = api.getDuration();

    if (!duration) {
        console.error('YTRE INIT: failed to retrieve non-zero video duration');
        return [];
    }

    songList = [];
    d.forEach(function(p, i){
        var a = $(p).find('a[href="#"]');
        if (!a.length) return;

        // get start time
        var timeSplit = a[0].text.split(":");
        var timeSplitLen = timeSplit.length;
        var startTime = 0;
        for (i = 0; i < timeSplitLen; i++) {
            startTime += parseInt(timeSplit[i])*Math.pow(60,timeSplitLen-1-i);
        }

        // get song name
        var name = $(p).contents().filter(function() {
            return this.nodeType == 3;
        }).text() || 'Unknown Song';

        var song = {
            idx: songList.length,
            name: name,
            startTime: startTime,
            endTime: duration
        };
        songList.push(song);
    });
    for (i = 0; i < songList.length-1; i++) {
        songList[i].endTime = songList[i+1].startTime;
    }

    console.log(songList);
    return songList;
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

function getCurrentSongIndex(time) {
	for (i = 0; i < songs.length; i++) {
		if (time >= songs[i].startTime &&
			time < songs[i].endTime) {
			return i;
		}
	}
}

function setNowPlaying() {
	var time = api.getCurrentTime();
	var playing = getCurrentSongIndex(time);

    // small time jump; different but defined song
    if (
        (Math.abs(time - wasTime) < 1) &&
        (playing !== wasPlaying)
    )
    {
        //set playing to the 'next' song; move the player

        if (wasPlaying < songs.length - 1) {
            playing = wasPlaying + 1;
        }
        else {
            //TODO implement loop on/off check
            if (true) {
                playing = 0;
            }
        }
        var seekTime = songs[playing].startTime;

        //move the player
        api.seekTo(seekTime, true);
    }

    // different but defined song
    if (
        (playing !== undefined) &&
        (playing !== wasPlaying)
    )
    {
        //update songName
        dom.songName.text(songs[playing].name);
        dom.songName.animate( 
            {opacity:0}, 
            200, 
            "linear", 
            function(){
                $(this).animate({opacity:1},200);
            })

        //update table
        //TODO...
    }

    wasPlaying = playing  
    wasTime = time;
}

function testEvents() {
    // run test code here
}

bind();
