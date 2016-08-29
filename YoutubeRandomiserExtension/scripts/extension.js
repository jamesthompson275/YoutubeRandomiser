/// <reference path="../../jquery.d.ts"/>

console.info('YTRE INIT: script load');

//TODO...
//YoutubeRandomiserExtension = {};
//YoutubeRandomiserExtension.init();

/** Get the first element matching ID "s". Null when not found. */
function $id(s){ return document.getElementById(s); }

/** Get the first element matching query string "s". Null when not found. */
function $elem(s){ return document.querySelector(s); }

/** Get array of elements matching query string "s". Empty array when not found. */
function $elems(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }

/** Get the child elements of "elem" as an array. */
function $childElems(elem) { return Array.prototype.slice.call(elem.children); }

/** Get the child nodes of "elem" as an array. */
function $childNodes(elem) { return Array.prototype.slice.call(elem.childNodes); }

/** Parse "s" and convert to an array of HTML elements. */
function $html(s) {
    var temp = document.createElement('div');
    temp.innerHTML = s;
    return $childElems(temp);
}

/** Bind an element, or array of elements' events to a callback. */
function $bind(elems, event, callback){
    if (elems.constructor === Array) {
        elems.forEach(function(elem){ elem.addEventListener(event, callback); });
    }
    else {
        elems.addEventListener(event, callback); 
    }
}

var api = null;
var songs = [];

var wasPlaying = -1;
var wasTime = -1;
var loop = false;
var shuffle = false;
var disable = false;

var dom = {
    prefix: 'YTRE',
    title: null,
    description: null,
    container: null,
    playerContainer: null,
    songName: null,
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
        setup();
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

function setup(attempt = 0){
    if (!watch) {
        console.info('YTRE INIT: abort (leaving page)');
        return;
    }

    if (attempt > 10) {
        console.error('YTRE INIT: fail (too many retries)');
        return;
    }

    // get player
    var _api = $id('movie_player');
    if (_api.getCurrentTime === undefined) {
        window.setTimeout(setup, 1000, attempt++);
        console.warn('YTRE INIT: retry (player not found)');
        return;
    }
    api = _api;

    // get DOM elements
    dom.title = $elem('h1.watch-title-container');
    dom.description = $elem('p#eow-description');

    if (!dom.title || !dom.description) {
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
    //Stands for 'YouTube Randomiser Extension'
    dom.container = $html(`
        <div id="YTRE">
            <div id="YTREPlayerContainer">
                <div style="margin: 5px;">
                    <b>Now Playing : </b>
                    <span id="YTRESongName" style="margin: 10px"> ... </span>
                </div>
                <div>
                    <button `+btnClasses+` id="YTREPrevBtn">    |<<    </button>
                    <button `+btnClasses+` id="YTRENextBtn">    >>|    </button>
                    <button `+btnClasses+` id="YTREShuffleBtn"> shuffle </button>
                    <button `+btnClasses+` id="YTRELoopBtn">    loop    </button>
                    <button `+btnClasses+` id="YTREDisableBtn"> disable </button>
                </div>
            </div>
            <div id="YTRETableContainer">
                <table id="YTRETable">
                </table>
            </div>
        </div>
    `)[0];
    dom.title.parentNode.insertBefore(dom.container, dom.title.nextSibling);
    dom.tableContainer = $id('YTRETableContainer');
    dom.playerContainer = $id('YTREPlayerContainer');
    dom.table = $id('YTRETable');
    dom.songName = $id('YTRESongName');
    dom.prevBtn = $id('YTREPrevBtn');
    dom.nextBtn = $id('YTRENextBtn');
    dom.loopBtn = $id('YTRELoopBtn');
    dom.shuffleBtn = $id('YTREShuffleBtn');
    dom.disableBtn = $id('YTREDisableBtn');

    // check DOM integrity
    for (var key in dom) {
        if (!dom[key]) {
            console.error('YTRE INIT: fail (DOM create failed for '+key+')');
            return;
        }
    }

    // populate song table
    createSongTable();

    // bind song table events
    tableBind();

    // bind standalone button events
    bind();

    loaded = true;
    console.info('YTRE INIT: done!');
    ticker();
}

function bind() {
    // click events

    $bind(dom.loopBtn, 'click', function(e){
        loop = !loop;
        dom.loopBtn.style['background-color'] = loop ? 'lightgray' : '';
    });

    $bind(dom.shuffleBtn, 'click', function(e){
        shuffle = !shuffle;
        setOrder(shuffle);
        purgeBuildTable();
        wasPlaying = -1;
        wasTime = -1;
        api.seekTo(0, true);
        dom.shuffleBtn.style['background-color'] = shuffle ? 'lightgray' : '';
    });

    $bind(dom.disableBtn, 'click', function(e){
        disable = !disable;
        dom.disableBtn.style['background-color'] = disable ? 'lightgray' : '';
        dom.table.style['color'] = disable ? 'lightgray' : 'black';
        dom.title.style['color'] = disable ? 'black' : 'lightgray';
        if (disable) {
            dom.prevBtn   .setAttribute('disabled', 'true');
            dom.nextBtn   .setAttribute('disabled', 'true');
            dom.shuffleBtn.setAttribute('disabled', 'true');
            dom.loopBtn   .setAttribute('disabled', 'true');
        }
        else {
            dom.prevBtn   .removeAttribute('disabled');
            dom.nextBtn   .removeAttribute('disabled');
            dom.shuffleBtn.removeAttribute('disabled');
            dom.loopBtn   .removeAttribute('disabled');
        }
    });

    $bind(dom.prevBtn, 'click', function(e){

        var time = api.getCurrentTime();
        var endTime = api.getDuration();
        var playing = getCurrentSongIndex(time);

        //prev: if song is defined, goto start of previous (wrap)
        if (playing !== undefined) {
            playing = playing - 1;
            if (playing < 0) {
                playing = songs.length - 1;
            }
        }

        //prev: if song is undefined, go to next-lower 'start' time
        if (playing == undefined) {
            playing = getSongBefore(time);
        }

        //prev: else start of video
        if (playing == undefined) {
            api.seekTo(0, true);
        }

        //'go' actions: set time, songID, player play, player seek, update DOM
        if (playing !== undefined) {
            var song = songs[playing];
            api.seekTo(song.startTime, true);
            api.playVideo();
            wasPlaying = playing;
            wasTime = time;
            showPlayingSong(playing);
        }
    });

    $bind(dom.nextBtn, 'click', function(e){

        var time = api.getCurrentTime();
        var endTime = api.getDuration();
        var playing = getCurrentSongIndex(time);

        //next: if song is defined, goto start of next (wrap)
        if (playing !== undefined) {
            playing = playing + 1;
            if (playing > songs.length-1) {
                playing = 0;
            }
        }

        //next: if song is undefined, goto next-upper 'start' time
        if (playing == undefined) {
            playing = getSongAfter(time);
        }

        //next: else end of video
        if (playing == undefined) {
            api.seekTo(endTime - 1, true);
        }

        //'go' actions: set time, songID, player play, player seek, update DOM
        if (playing !== undefined) {
            var song = songs[playing];
            api.seekTo(song.startTime, true);
            api.playVideo();
            wasPlaying = playing;
            wasTime = time;
            showPlayingSong(playing);
        }
    });
}

function tableBind(){
	$bind($elems('#YTRE .playNow'), 'click', function(e) {
    	var idx = e.target.parentElement.parentElement.getAttribute('id').substring(4);
    	for (i = 0; i < songs.length; i++) {
    		if (idx == songs[i].idx) {
    			api.seekTo(songs[i].startTime, true);
    		}
    	}
    });

    $bind($elems('#YTRE .moveUp'), 'click', function(e) {   	
    	var idx = e.target.parentElement.parentElement.getAttribute('id').substring(4);
    	for (i = 1; i < songs.length; i++) {
    		if (idx == songs[i].idx) {
    			var tmp = songs[i-1];
    			songs[i-1] = songs[i];
    			songs[i] = tmp;
                if (wasPlaying == i) { wasPlaying = i-1; }
                else if (wasPlaying == i-1) { wasPlaying = i; }
    			purgeBuildTable();
                showPlayingSong(wasPlaying);
                return;
    		}
    	}
    });

    $bind($elems('#YTRE .moveDown'), 'click', function(e) {
    	var idx = e.target.parentElement.parentElement.getAttribute('id').substring(4);

    	for (i = 0; i < songs.length - 1; i++) {
    		if (idx == songs[i].idx) {
    			var tmp = songs[i+1];
    			songs[i+1] = songs[i];
    			songs[i] = tmp;
                if (wasPlaying == i) { wasPlaying = i+1; }
                else if (wasPlaying == i+1) { wasPlaying = i; }
    			purgeBuildTable();
                showPlayingSong(wasPlaying);
                return;
    		}
    	}
    });
}

function getSongBefore(time) { 
    var song = undefined;
    songs.filter(function(x){ return x.startTime <= time; }).forEach(function(x){
        if (song == undefined) song = x;
        if (song.startTime < x.startTime) song = x;
    });
    return song;
 }

function getSongAfter(time) { 
    var song = undefined;
    songs.filter(function(x){ return x.startTime >= time; }).forEach(function(x){
        if (song == undefined) song = x;
        if (song.startTime > x.startTime) song = x;
    });
    return song;
 }

function getStartTimes() { 
    return songs.map(function(x){ return x.startTime; })
 }

function destroy() {}

function init() {
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

//TODO JQuery purge
function getSongs() {

    // get description parts
    var s = '<p>' + dom.description.outerHTML.split('<br>').join('</p><p>') + '</p>';
    var d = $html(s);
    var duration = api.getDuration();

    if (!duration) {
        console.error('YTRE INIT: failed to retrieve non-zero video duration');
        return [];
    }

    songList = [];
    d.forEach(function(p, i){
        var a = p.querySelector('a[href="#"]');
        if (!a) return;

        // get start time
        var timeStr = a.innerHTML;
        var timeSplit = timeStr.split(":");
        var timeSplitLen = timeSplit.length;
        var startTime = 0;
        for (i = 0; i < timeSplitLen; i++) {
            startTime += parseInt(timeSplit[i])*Math.pow(60,timeSplitLen-1-i);
        }

        // get song name (text nodes only - ignore contents of <a> etc)
        var name = $childNodes(p)
            .filter(function(x){ return x.nodeType == 3; })
            .map(function(x){ return x.nodeValue; })
            .join(' ');

        if (!name) {
            name = 'Unknown Song';
            console.warning('YTRE INIT: empty song name for @'+timeStr);
        }

        var song = {
            idx: songList.length,
            name: name,
            startTime: startTime,
            endTime: Math.floor(duration)
        };
        songList.push(song);
    });
    for (i = 0; i < songList.length-1; i++) {
        songList[i].endTime = songList[i+1].startTime;
    }

    console.table(songList);
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

function sort(songList) {
    songList.sort(function(s1, s2) {
        return s1.idx - s2.idx;
    });
    return songList;
}

function getCurrentSongIndex(time) {
	for (i = 0; i < songs.length; i++) {
		if (time >= songs[i].startTime &&
			time < songs[i].endTime) {
			return i;
		}
	}
}

function setOrder(shuffle) {
	songs = shuffle ? unsort(songs) : sort(songs);
	api.seekTo(songs[0].startTime,true);
	wasPlaying = songs[0];
	wasTime = songs[0].startTime
}

function purgeBuildTable() {
	dom.table.innerHTML="";
	createSongTable();
	tableBind();
}

function createSongTable() {
	for (i = 0; i < songs.length; i++) {
		var row = dom.table.insertRow(-1);
		var cell0 = row.insertCell(0);
		var cell1 = row.insertCell(1);
		var cell2 = row.insertCell(2);
		row.setAttribute("id", "song"+songs[i].idx);
		var lenSec = songs[i].endTime - songs[i].startTime;
		var lenMin = Math.floor(lenSec / 60);
		lenSec -= lenMin*60;
		if (lenSec < 10) {
			lenSec= "0"+lenSec;
		}
		cell0.innerHTML = songs[i].name;
		cell1.innerHTML = lenMin+":"+lenSec;
		cell2.innerHTML = "<span class='playNow' >\u25B6</span>"+
						  "<span class='moveUp'  >\u2227</span>"+
			              "<span class='moveDown'>\u2228</span>";
	}
}

function setNowPlaying() {

	var time = api.getCurrentTime();
    var endTime = api.getDuration();
	var playing = getCurrentSongIndex(time);

    // on sub-second time jump && song state change (any change)
    if (
        (((Math.abs(time - wasTime) < 0.5) && (playing !== wasPlaying)) ||
          (Math.abs(time - endTime) < 0.5)) &&
          !disable
    ){
        //step to the next song
        if (wasPlaying < songs.length - 1) {
            playing = wasPlaying + 1;
        }
        else {
            //special conditions for looping
            if (loop) {
                playing = 0;
            }
            else {
                wasPlaying = -1;
                wasTime = -1;
                if (Math.abs(time - endTime) < 0.5) {
                    api.seekTo(endTime - 1, true);
                }
                api.pauseVideo();
                return;
            }
        }
        //move the player
        var seekTime = songs[playing].startTime;
        api.seekTo(seekTime, true);
    }

    // on song state change (to a real song)
    if (
        (playing !== undefined) &&
        (playing !== -1) &&
        (playing !== wasPlaying)
    ){
        showPlayingSong(playing);
    }

    wasPlaying = playing  
    if (!disable) wasTime = time;
}

function showPlayingSong(playing) {
    //update songName
    dom.songName.innerHTML = songs[playing].name;

    //animate songName
    dom.songName.classList.remove('animate-flash');
    setTimeout(function() {
        dom.songName.classList.add('animate-flash');
    }, 20);

    //update table
    for (i = 0; i < songs.length; i++) {
        var idx = songs[i].idx;
        var row = $id('song'+idx);
        row.classList.remove("currentSong");
        if (playing == i) {
            row.classList.add("currentSong");
        }
    }
}

init();
