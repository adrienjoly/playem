window.SOUNDCLOUD_CLIENT_ID = "496ce54cc74f2e4ba1945ada07cd1c56";
window.DEBUG = false; // for soundmanager

// components

function initPlayem(playerContainer, playerId, cb) {
	console.info("initializing players...");
	var playem, PLAYERS = [
			"Youtube",
			"SoundCloud",
			"Vimeo",
			"Dailymotion",
		//	"Deezer",
			"AudioFile",
			"Bandcamp"
		],
		PLAYER_PARAMS = {
			playerId: playerId,
			origin: window.location.host || window.location.hostname,
			width: $(playerContainer).width(),
			height: $(playerContainer).height(),
			playerContainer: playerContainer
		};
	loadJS("/js/playem-min.js", function(){
		playem = new Playem();
		PLAYERS.map(function(pl) {
			//console.log("Init " + pl + " player...");
			playem.addPlayer(window[pl + "Player"], PLAYER_PARAMS);
		});
		cb(playem);
	});
}

function loadSoundManager(cb){
	//console.info("initializing soundmanager2...");
	loadJS("/js/soundmanager2" + (DEBUG ? ".js" : "-nodebug-jsmin.js"), function(){
		soundManager.setup({debugMode: DEBUG, url: "/swf/soundmanager2_xdomain.swf", flashVersion: 9, onready: function() {
			soundManager.isReady=true;
		}});
		soundManager.beginDelayedInit();
	});
	cb();
}

// actual init

var shortcuts = {
	"/yt/": window.location.protocol+"//youtube.com/v/",
	"/sc/": window.location.protocol+"//soundcloud.com/",
	"/dm/": window.location.protocol+"//dailymotion.com/video/",
	"/vi/": window.location.protocol+"//vimeo.com/",
	"/dz/": window.location.protocol+"//www.deezer.com/track/"
};

function getTrackUrl(eId){
	for (var s in shortcuts)
		if (eId.indexOf(s) == 0)
			return eId.replace(s, shortcuts[s]);
	return eId;
}

function PlayemWrapper(playem){
	var self;
	playem.on("onTrackChange", function(track){
		self.current = track.metadata;
		self.onTrackPlaying(track.metadata);
	});
	return self = {
		onTrackPlaying: null,
		current: null,
		vids: playem.getQueue(),
		clear: function(){
			playem.clearQueue();
		},
		addTrack: function(fbItem){
			console.log(fbItem.link);
			var metadata = {
				i: playem.getQueue().length,
				//eId: embedId,
				url: fbItem.link,
				name: fbItem.name,
				desc: fbItem.description,
				from: fbItem.from,
				time: fbItem.updated_time,
				msg: fbItem.message,
				fbUrl: fbItem.actions[0].link
			}
			try {
				playem.addTrackByUrl(fbItem.link, metadata);
				return metadata
			} catch(e) {};
		},
		play: function(index){
			var self = this;
			playem.play(index);
		},
		next: function(){
			playem.next();
		}
	};
}
