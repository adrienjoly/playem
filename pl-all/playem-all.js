/* playemjs commit: 6db6562fa2e8a003754b44a0a06906106fa7d015 */

function AudioFilePlayer(){
	return AudioFilePlayer.super_.apply(this, arguments);
}

(function() {

	/*
	loader.includeJS("/js/soundmanager2.js", function() { //-nodebug-jsmin
		console.log("loaded mp3 player");
		soundManager.setup({
			url: '/swf/', //sound manager swf directory
			flashVersion: 9,
			onready: function() {
				console.log("mp3 player is ready");
				//that.isReady = true;
				soundManager.isReady = true;
				//eventHandlers.onApiReady && eventHandlers.onApiReady(that);
			}
		});
	});
	*/

	var EVENT_MAP = {
		"onplay": "onPlaying",
		"onresume": "onPlaying",
		"onpause": "onPaused",
		"onstop": "onPaused",
		"onfinish": "onEnded"
	};

	function Player(eventHandlers, embedVars) {  
		this.label = 'Audio file';
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.element = null;
		this.widget = null;
		this.isReady = false;
		this.trackInfo = {};
		var i, loading, that = this;

		this.soundOptions = {
			id: null,
			url: null,
			autoLoad: true,
			autoPlay: true,
			ontimeout: function(e) {
				//console.log("AudioFilePlayer timeout event:", e);
				that.eventHandlers.onError && that.eventHandlers.onError(that, {code:"timeout", source:"AudioFilePayer"});
			}
		};

		for (i in EVENT_MAP)
			(function(i) {
				that.soundOptions[i] = function() {
					//console.log("event:", i, this);
					var handler = eventHandlers[EVENT_MAP[i]];
					handler && handler(that);
				}
			})(i);

		loading = setInterval(function(){
			try {
				if (window["soundManager"]) {
					clearInterval(loading);
					that.isReady = true;
					eventHandlers.onApiReady && eventHandlers.onApiReady(that);
				}
			}
			catch (e) {
				that.eventHandlers.onError && that.eventHandlers.onError(that, {source:"AudioFilePayer", exception:e});
			};
		}, 200);
	}

	Player.prototype.getEid = function(url, cb) {
		url = (url || "").split("#").pop();
		if (!url)
			return cb(null, this);
		var ext = url.split("#").pop().toLowerCase().split(".").pop().toLowerCase();
		if (ext == "mp3" || ext == "ogg")
			cb(url, this);
		else
			cb(null, this);
	}
	
	Player.prototype.getTrackInfo = function(callback) {
		var that = this, i = setInterval(function() {
			//console.log("info", that.widget.duration)
			if (that.widget && that.widget.duration) {
				clearInterval(i);
				callback(that.trackInfo = {
					duration: that.widget.duration / 1000, // that.widget.durationEstimate / 1000
					position: that.widget.position / 1000
				});
				//that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.widget);
			}
		}, 500);
	}

	Player.prototype.getTrackPosition = function(callback) {
		var that = this;
		//console.log("position", that.widget.position)
		this.getTrackInfo(function(){
			callback(that.trackInfo.position);
			that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
		});
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.widget && this.widget.setPosition(Math.floor(Math.min(this.widget.duration, pos * 1000) - 2000));
	};
	
	Player.prototype.embed = function(vars) {
		if (!vars || !vars.trackId)
			return;
		//console.log("AudioFilePlayer embed vars:", vars);
		this.embedVars = vars = vars || {};
		this.soundOptions.id = vars.playerId = vars.playerId || 'mp3Player' + (new Date()).getTime();
		this.soundOptions.url = vars.trackId;
		this.trackInfo = {};
		if (this.widget) {
			this.pause();
			this.widget = null;
			delete this.widget;
		}
		//console.log("-> soundManager parameters", this.soundOptions);
		this.widget = soundManager.createSound(this.soundOptions);
		//console.log("-> soundManager instance", !!this.widget);
		this.eventHandlers.onEmbedReady && this.eventHandlers.onEmbedReady(this);
		this.eventHandlers.onTrackInfo && this.getTrackInfo(this.eventHandlers.onTrackInfo);
		this.play();
	}

	Player.prototype.play = function(id) {
		//console.log("mp3 play", id)
		this.isReady && this.embed({trackId:id});
	}

	Player.prototype.resume = function() {
		this.isReady && this.widget && this.widget.resume();
	}

	Player.prototype.pause = function() {
		try {
			this.isReady && this.widget && this.widget.pause();
		}
		catch(e) {
			console.error(e.stack);
		}
	}

	Player.prototype.stop = function() {
		this.widget.stop();
	}

	Player.prototype.setVolume = function(vol) {
		if (this.widget && this.widget.setVolume && this.soundOptions)
			/*this.widget*/soundManager.setVolume(this.soundOptions.id, 100 * vol);
	}

	//return Player;
	//inherits(AudioFilePlayer, Player);
	AudioFilePlayer.prototype = Player.prototype;
	AudioFilePlayer.super_ = Player;
})();
window.$ = window.$ || function(){return window.$};
$.getJSON = $.getJSON || function(url,cb){
  var cbName = "_cb_" + Date.now();
  url = url.replace("callback=?", "callback=" + cbName);
  window[cbName] = function(){
    //console.log(url, "ok");
    cb.apply(window, arguments);
    delete window[cbName];
  };
  //console.log(url, "...");
  loader.includeJS(url);
};

function BandcampPlayer(){
  return BandcampPlayer.super_.apply(this, arguments);
}

(function(API_KEY){

  var API_PREFIX = '//api.bandcamp.com/api',
      API_SUFFIX = '&key=' + API_KEY + '&callback=?';

  function isBandcampUrl(url) {
    return url.indexOf("/bc/") == 0 || url.indexOf("bandcamp.com") != -1;
  }

  function extractStreamUrl(eId) {
    var parts = eId.split("#");
    return parts.length < 2 || eId.indexOf("/bc/") ? null : parts.pop();
  }

  function fetchStreamUrl(url, cb){
    $.getJSON(API_PREFIX + '/url/1/info?url=' + encodeURIComponent(url) + API_SUFFIX, function(data) {
      var trackId = (data || {}).track_id;
      if (!trackId)
        return cb();
      $.getJSON(API_PREFIX + '/track/3/info?track_id=' + trackId + API_SUFFIX, function(data) {
        cb((data || {}).streaming_url);
      });
    });
  }

  //============================================================================
  function Player(eventHandlers) {
    var self = this, loading = null;
    this.label = 'Bandcamp';
    this.eventHandlers = eventHandlers || {};
    this.currentTrack = {position: 0, duration: 0};
    this.sound = null;
    this.isReady = false;
    loading = setInterval(function(){
      if (!!window["soundManager"]) {
        clearInterval(loading);
        self.isReady = true;
        self.clientCall("onApiReady", self);
      }
    }, 200);
  }
  
  //============================================================================
  Player.prototype.clientCall = function(fctName, p) {
    var args = Array.apply(null, arguments).slice(1) // exclude first arg
    //try {
      return (this.eventHandlers[fctName] || function(){}).apply(null, args);
    //}
    //catch(e) {
    //  console.error(e.stack);
    //}
  }
  
  //============================================================================
  Player.prototype.soundCall = function(fctName, p) {
    var args = Array.apply(null, arguments).slice(1) // exclude first arg
    return ((this.sound || {})[fctName] || function(){}).apply(null, args);
  }
  
  //============================================================================
  Player.prototype.getEid = function(url, cb) {
    cb(isBandcampUrl(url) && url, this);
  }

  Player.prototype.playStreamUrl = function(url) {
    var self = this;
    self.sound = soundManager.createSound({
      id: '_playem_bc_' + Date.now(),
      url: url,
      autoLoad: true,
      autoPlay: true,
      whileplaying: function() {
        self.clientCall("onTrackInfo", self.currentTrack = {
          position: self.sound.position / 1000,
          duration: self.sound.duration / 1000
        });
      },
      onplay: function(a) {
        self.clientCall("onPlaying", self);
      },
      onresume: function() {
        self.clientCall("onPlaying", self);
      }, 
      onfinish: function() {
        self.clientCall("onEnded", self);
      }
    });
  }

  //============================================================================
  Player.prototype.play = function(id) {
    var self = this, stream = extractStreamUrl(id);
    if (stream)
      this.playStreamUrl(stream);
    else
      fetchStreamUrl(id, function(stream){
        self.playStreamUrl(stream);
      });
  }
  
  //============================================================================
  Player.prototype.pause = function() {
    this.soundCall("pause");
  }
  
  //============================================================================
  Player.prototype.stop = function() {
    this.soundCall("stop");
    this.soundCall("destruct");
    this.sound = null;
  }
  
  //============================================================================
  Player.prototype.resume = function() {
    this.soundCall("resume");
  }
  
  //============================================================================
  // pos: seconds
  Player.prototype.setTrackPosition = function(pos) {
    this.soundCall("setPosition", Math.round(pos * 1000));
  }
  
  //============================================================================
  // vol: float between 0 and 1
  Player.prototype.setVolume = function(vol) {
    this.soundCall("setVolume", Math.round(vol * 100));
  }
  
  //============================================================================
  //return Player;
  //inherits(BandcampPlayer, Player);
  BandcampPlayer.prototype = Player.prototype;
  BandcampPlayer.super_ = Player;
})('vatnajokull');
function DailymotionPlayer(){
	return DailymotionPlayer.super_.apply(this, arguments);
}

(function() {

	var regex = /https?:\/\/(?:www\.)?dailymotion.com(?:\/embed)?\/video\/([\w-]+)/,
		ignoreEnded = 0;
		EVENT_MAP = {
			0: "onEnded",
			1: "onPlaying",
			2: "onPaused"
		};

	function Player(eventHandlers, embedVars) {
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.label = "Dailymotion";
		this.element = null;
		this.isReady = false;
		this.trackInfo = {};
		var that = this;

		window.onDailymotionStateChange = function(newState) {
			console.log("DM new state", newState);
			if (newState > 0 || !ignoreEnded)
				that.safeClientCall(EVENT_MAP[newState], that);
			else
				--ignoreEnded;
			/*if (newState == 1) {
				console.log("getduration", that.element.getDuration());
				that.trackInfo.duration = that.element.getDuration(); //that.safeCall("getDuration");
			}*/
		};

		window.onDailymotionError = function(error) {
			console.log("DM error", error)
			that.safeClientCall("onError", that, {source:"DailymotionPlayer", data: error});
		}

		window.onDailymotionAdStart = function(){
			console.log("DM AD START");
			that.safeClientCall("onBuffering", that);
		}

		/*window.onDailymotionVideoProgress = function(a) {
			console.log("progress", a)
		}*/

		window.onDailymotionPlayerReady = function(playerId) {
			that.element = /*that.element ||*/ document.getElementById(playerId); /* ytplayer*/
			that.element.addEventListener("onStateChange", "onDailymotionStateChange");
			that.element.addEventListener("onError", "onDailymotionError");
			that.element.addEventListener("onLinearAdStart", "onDailymotionAdStart");
			//that.element.addEventListener("onLinearAdComplete", "onDailymotionAdComplete");
			//that.element.addEventListener("onVideoProgress", "onDailymotionVideoProgress");
		}
		
		that.isReady = true;
		that.safeClientCall("onApiReady", that);
	}
	
	Player.prototype.safeCall = function(fctName, p1, p2) {
		//return (this.element || {})[fctName] && this.element[fctName](p1, p2);
		var args = Array.apply(null, arguments).slice(1), // exclude first arg (fctName)
			fct = (this.element || {})[fctName];
		return fct && fct.apply(this.element, args);
	}
	
	Player.prototype.safeClientCall = function(fctName, p1, p2) {
		try {
			return this.eventHandlers[fctName] && this.eventHandlers[fctName](p1, p2);
		}
		catch(e) {
			console.error("DM safeclientcall error", e.stack);
		}
	}

	Player.prototype.embed = function (vars) {
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'dmplayer';
		this.trackInfo = {};
		this.element = document.createElement("object");
		this.element.id = this.embedVars.playerId;
		this.embedVars.playerContainer.appendChild(this.element);

		var paramsQS,
			paramsHTML,
			embedAttrs, 
			params = {
				allowScriptAccess: "always"
			},
			atts = {
				id: this.embedVars.playerId
			},
			swfParams = {
				//api: "postMessage",
				info: 0,
				logo: 0,
				related: 0,
				autoplay: 1,
				enableApi: 1,
				showinfo: 0,
				hideInfos: 1,
				chromeless: 1,
				withLoading: 0,
				playerapiid: this.embedVars.playerId
			};

		paramsQS = Object.keys(swfParams).map(function(k){ // query string
			return k + "=" + encodeURIComponent(swfParams[k]);
		}).join("&");

		paramsHTML = Object.keys(params).map(function(k){
			return '<param name="' + k +'" value="' + encodeURIComponent(params[k]) + '">';
		}).join();

		embedAttrs = {
			id: this.embedVars.playerId,
			width: this.embedVars.width || '200',
			height: this.embedVars.height || '200',
			type: "application/x-shockwave-flash",
			data: window.location.protocol+'//www.dailymotion.com/swf/'+this.embedVars.videoId+'?'+paramsQS,
			innerHTML: paramsHTML
		};
		if (USE_SWFOBJECT) {
			swfobject.embedSWF(embedAttrs.data, this.embedVars.playerId, embedAttrs.width, embedAttrs.height, "9.0.0", "/js/swfobject_expressInstall.swf", null, params, atts);
		}
		else {
			$(this.element).attr(embedAttrs);
		}
		$(this.element).show();
		this.safeClientCall("onEmbedReady");
	}

	Player.prototype.getEid = function(url, cb) {
		cb((url.match(regex) || []).pop(), this);
	}

	Player.prototype.play = function(id) {
		if (!this.currentId || this.currentId != id) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	Player.prototype.pause = function(vol) {
		this.safeCall("pauseVideo");
	};

	Player.prototype.resume = function(vol) {
		this.safeCall("playVideo");
	};
	
	Player.prototype.stop = function(vol) {
		++ignoreEnded;
		//this.element.stopVideo();
		this.safeCall("clearVideo");
		if ((this.element || {}).parentNode)
			this.element.parentNode.removeChild(this.element);
	};
	
	Player.prototype.getTrackPosition = function(callback) {
		this.trackInfo.duration = this.safeCall("getDuration");
		callback && callback(this.safeCall("getCurrentTime"));
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.safeCall("seekTo", pos);
	};
	
	Player.prototype.setVolume = function(vol) {
		this.safeCall("setVolume", vol * 100);
	};

	//return Player;
	//inherits(DailymotionPlayer, Player);
	DailymotionPlayer.prototype = Player.prototype;
	DailymotionPlayer.super_ = Player;
})();
// WARNING:
// The following global constants must be set before instantiation:
//             DEEZER_APP_ID and DEEZER_CHANNEL_URL

window.showMessage = window.showMessage || function(msg) {
  console.warn("[showMessage]", msg);
};

window.$ = window.$ || function(){return window.$};
$.getScript = $.getScript || function(js,cb){loader.includeJS(js,cb);};
$.append = $.append || function(html){document.write(html);};

function DeezerPlayer(){
  return DeezerPlayer.super_.apply(this, arguments);
}

(function(){

  // CONSTANTS
  var SDK_URL = 'https://cdns-files.deezer.com/js/min/dz.js',
      SDK_LOADED = false,
      IS_LOGGED = false,
      URL_REG = /(?:https?:)?\/\/(?:www\.)deezer\.com\/track\/(\d+)/i,
      EVENT_MAP = {
        player_play: 'onPlaying',
        player_paused: 'onPaused',
        player_position: 'onTrackInfo'
      };

  //============================================================================
  function Player(eventHandlers) {
    
    var self = this;
    
    this.label = 'Deezer';
    this.eventHandlers = eventHandlers || {};    
    this.currentTrack = {position: 0, duration: 0};
        
    loadSDK(function() {
      init(function() { 
        //console.log('DeezerPlayer ready');
        //DZ.getLoginStatus = function(cb) {cb && cb({userID: null})}
        DZ.getLoginStatus(function(response) {
          DZ.player.setRepeat(0);
          IS_LOGGED = response.userID;
          self.isReady = true;
          hookHandlers(self);          
        });
      });       
    });                
    
  }
  
  //============================================================================
  Player.prototype.isLogged = function() {
    return IS_LOGGED;
  }
  
  //============================================================================
  Player.prototype.getEid = function(url, cb) {
    cb(URL_REG.test(url) ? RegExp.$1 : null, this);
  }
  
  //============================================================================
  Player.prototype.play = function(id) {
    var self = this;
    if (IS_LOGGED) {
      DZ.player.playTracks([id], 0);
    } else {
      DZ.api('/track/' + id, function(data) {
        showMessage(
          'This is a 30 secs preview. ' + 
          '<a href="javascript:DeezerPlayer.login()">' +
          'Connect to Deezer</a> to listen to the full track.'
        );                  
        self.sound = createSound(self, data.preview)
      });     
    }    
  }
  
  //============================================================================
  Player.prototype.pause = function() {
    if (this.sound) {
      this.sound.pause();
    } else {
      DZ.player.pause();
    }
  }
  
  //============================================================================
  Player.prototype.stop = function() {
    if (this.sound) {
      this.sound.stop();
      this.sound.destruct();
      this.sound = null;
    } else {
      DZ.player.pause();
    }    
  }
  
  //============================================================================
  Player.prototype.resume = function() {
    if (this.sound) {
      this.sound.resume();
    } else {
      DZ.player.play();
    }
  }
  
  //============================================================================
  // pos: seconds
  Player.prototype.setTrackPosition = function(pos) {
    if (this.sound)
      this.sound.setPosition(Math.round(pos * 1000));
    else
      DZ.player.seek(Math.round(100 * pos / this.currentTrack.duration));
  }
  
  //============================================================================
  // vol: float between 0 and 1
  Player.prototype.setVolume = function(vol) {
    if (this.sound)
      this.sound.setVolume(Math.round(vol * 100));
    else
      DZ.player.setVolume(Math.round(vol * 100));
  }
    
  //============================================================================  
  function loadSDK(cb) {
    if (!SDK_LOADED) {
      //$('body').append('<div id="dz-root"></div>');
      var dz = document.createElement('div'); dz.id = 'dz-root';
      document.getElementsByTagName("body")[0].appendChild(dz);
      $.getScript(SDK_URL, function() {
        SDK_LOADED = true;
        cb();
      });
    } else {
      cb();
    }
  }  
  
  //============================================================================
  function init(onload) {
    DZ.init({
      appId: DEEZER_APP_ID,
      channelUrl: DEEZER_CHANNEL_URL,
      player: {
        onload: onload
      }
    });
  }
  
  //============================================================================
  function hookHandlers(self) {
    
    function createHandler(e) {
      if (e === 'player_position') {
        return function(eventObject) {
          var onTrackInfoHandler = self.eventHandlers.onTrackInfo, 
              onEndedHandler = self.eventHandlers.onEnded,
              position = eventObject[0],
              duration = eventObject[1];
          if (onTrackInfoHandler) {
            self.currentTrack = {position: position, duration: duration};
            onTrackInfoHandler(self.currentTrack);
          }
          if ((duration - position <= 1.5) && onEndedHandler)
            onEndedHandler(self);          
        };
      }
      return function() {
        var handler = self.eventHandlers[EVENT_MAP[e]];
        handler && handler(self);
      };
    }            
    
    for (var e in EVENT_MAP)
      DZ.Event.suscribe(e, createHandler(e));
    self.eventHandlers.onApiReady && self.eventHandlers.onApiReady(self);
  }
  
  //============================================================================
  function createSound(self, url) {    
    return soundManager.createSound({
      id: 'deezerSound' + Date.now(),
      url: url,
      autoLoad: true,
      autoPlay: true,         
      whileplaying: function() {
        self.currentTrack = {
          position: self.sound.position / 1000,
          duration: self.sound.duration / 1000
        };            
        if (self.eventHandlers.onTrackInfo)
          self.eventHandlers.onTrackInfo(self.currentTrack);
      },
      onplay: function() {
        if (self.eventHandlers.onPlaying)
          self.eventHandlers.onPlaying(self);
      },
      onresume: function() {
        if (self.eventHandlers.onPlaying)
          self.eventHandlers.onPlaying(self);
      }, 
      onfinish: function() {
        if (self.eventHandlers.onEnded)
          self.eventHandlers.onEnded(self);
      }
    });    
  }
  
  //============================================================================  
  DeezerPlayer.login = function() {
    DZ.login(function(response) {
      if (response.userID) {
        IS_LOGGED = true;
        showMessage('Login successful. Your Deezer tracks will be full length from now on!');        
      } else {
        showMessage('Deezer login unsuccesful.', true);
      }
    }, {perms: 'email'});
  }
  
  //============================================================================
  //return Player;
  //inherits(DeezerPlayer, Player);
  DeezerPlayer.prototype = Player.prototype;
  DeezerPlayer.super_ = Player;
})();
//loader.includeJS("https://w.soundcloud.com/player/api.js");

window.$ = window.$ || function(){return window.$};
$.getScript = $.getScript || function(js,cb){loader.includeJS(js,cb);};

function SoundCloudPlayer(){
	return SoundCloudPlayer.super_.apply(this, arguments);
};

(function() {
	var EVENT_MAP = {
			"onplay": "onPlaying",
			"onresume": "onPlaying",
			"onpause": "onPaused",
			"onstop": "onPaused",
			"onfinish": "onEnded"
		},
		ERROR_EVENTS = [
			"onerror",
			"ontimeout",
			"onfailure",
			"ondataerror"
		];

	function Player(eventHandlers, embedVars) {  
		this.label = 'SoundCloud';
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.element = null;
		this.widget = null;
		this.isReady = false;
		this.trackInfo = {};
		this.soundOptions = {autoPlay:true};

		var that = this;
		$.getScript("https://connect.soundcloud.com/sdk.js", function() {
			SC.initialize({client_id: SOUNDCLOUD_CLIENT_ID});
			for (var i in EVENT_MAP)
				(function(i) {
					that.soundOptions[i] = function() {
						//console.log("SC event:", i /*, this*/);
						var handler = eventHandlers[EVENT_MAP[i]];
						handler && handler(that);
					}
				})(i);
			ERROR_EVENTS.map(function(evt){
				that.soundOptions[evt] = function(e) {
					console.error("SC error:", evt, e, e.stack);
					that.eventHandlers.onError && that.eventHandlers.onError(that, {code:evt.substr(2), source:"SoundCloudPlayer"});
				};
			});
			that.isReady = true;
			soundManager.onready(function() {
				that.callHandler("onApiReady", that); // eventHandlers.onApiReady && eventHandlers.onApiReady(that);
			});
		});

		this.callHandler = function(name, params) {
			try {
				eventHandlers[name] && eventHandlers[name](params);//.apply(null, params);
			}
			catch (e) {
				console.error("SC error:", e, e.stack);
			}
		}
	}

	Player.prototype.safeCall = function(fctName, param) {
		try {
			//console.log("SC safecall", fctName);
			if (this.widget && this.widget[fctName])
				this.widget[fctName](param);
		}
		catch(e) {
			console.error("SC safecall error", e.stack);
		}
	}

	Player.prototype.getEid = function(url, cb) {
		var matches = /(?:https?:)?\/\/(?:www\.)?soundcloud\.com\/([\w-_\/]+)/.exec(url);
		cb(matches ? url.substr(url.lastIndexOf("/")+1) : null, this);
	}

	Player.prototype.getTrackPosition = function(callback) {
		callback(this.trackInfo.position = this.widget.position / 1000);
		if (this.widget.durationEstimate)
			this.eventHandlers.onTrackInfo && this.eventHandlers.onTrackInfo({
				duration: this.widget.duration / 1000
			});
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.safeCall("setPosition", pos * 1000);
	};

	Player.prototype.play = function(id) {
		this.trackInfo = {};
		this.embedVars.trackId = id;
		//console.log("soundcloud play", this.embedVars);
		var that = this;

		SC.stream("/tracks/"+id, this.soundOptions, function(sound){
			that.widget = sound;
			that.callHandler("onEmbedReady", that);
			//that.safeCall("play");
		});
	}

	Player.prototype.resume = function() {
		this.safeCall("play");
	}

	Player.prototype.pause = function() {
		this.safeCall("pause");
	}

	Player.prototype.stop = function() {
		this.safeCall("stop");
	}

	Player.prototype.setVolume = function(vol) {
		this.safeCall("setVolume", 100 * vol);
	}

	//inherits(SoundCloudPlayer, Player);
	SoundCloudPlayer.prototype = Player.prototype;
	SoundCloudPlayer.super_ = Player;
	// this method exports Player under the name "SoundCloudPlayer", even after minification
	// so that SoundCloudPlayer.name == "SoundCloudPlayer" instead of SoundCloudPlayer.name == "Player"
})();
window.$ = window.$ || function(){return window.$};
$.show = $.show || function(){return $};
$.param = $.param || function(obj){
	return Object.keys(obj).map(function(f){
		return encodeURIComponent(f) + "=" + encodeURIComponent(obj[f]);
	}).join("&");
};

function VimeoPlayer(){
	return VimeoPlayer.super_.apply(this, arguments);
}

(function() {

	var USE_FLASH_VIMEO = true, // ... or "universal embed" (iframe), if false
		EVENT_MAP = {
			"play": "onPlaying",
			"resume": "onPlaying",
			"pause": "onPaused",
			"finish": "onEnded",
			"playProgress": function(that, e) { // Html5 event
				that.trackInfo = {
					duration: Number(e.data.duration),
					position: Number(e.data.seconds)
				};
				that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
			},
			"progress": function(that, seconds) { // Flash event
				that.trackInfo = {
					duration: Number(that.element.api_getDuration()),
					position: Number(seconds)
				};
				that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
			}
		};

	function Player(eventHandlers, embedVars) {  
		this.label = 'Vimeo';
		this.element = null;
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.isReady = false;
		this.trackInfo = {};
		var i, that = this;
		
		if (!USE_FLASH_VIMEO) {
			function onMessageReceived(e) {
				//console.log("onMessageReceived", e, e.origin, e.data);
				try {
					var data = JSON.parse(e.data);
					if (data.player_id == that.embedVars.playerId) {
						//console.log("VIMEO EVENT", data);
						if (data.event == "ready")
							for (i in EVENT_MAP)
								that.post('addEventListener', i);
						else
							setTimeout(function(){
								(eventHandlers[EVENT_MAP[data.event]] || EVENT_MAP[data.event])(that, data);
							});
					}
				} catch (e) {
					console.log("VimeoPlayer error", e, e.stack);
					that.eventHandlers.onError && that.eventHandlers.onError(that, {source:"VimeoPayer", exception: e});
				}
			}
			if (window.addEventListener)
				window.addEventListener('message', onMessageReceived, false);
			else
				window.attachEvent('onmessage', onMessageReceived, false);
		}
		
		//loader.includeJS("http://a.vimeocdn.com/js/froogaloop2.min.js", function() {
			that.isReady = true;
			eventHandlers.onApiReady && eventHandlers.onApiReady(that);
		//});
	}

	Player.prototype.post = USE_FLASH_VIMEO ? function(action, value) {
		try {
		    var args = Array.apply(null, arguments).slice(1) // exclude first arg
		    return this.element["api_"+action].apply(this.element, args);
		} catch (e) {
			console.log("VIMEO error", e, e.stack);
			//that.eventHandlers.onError && that.eventHandlers.onError(that, {source:"VimeoPayer", exception:e});
		}
	} : function(action, value) { // HTML 5 VERSION
		var data = {method: action};
		if (value)
			data.value = value;
		this.element.contentWindow.postMessage(JSON.stringify(data), this.element.src.split("?")[0]);
	}

	Player.prototype.getEid = function(url, cb) {
		var matches = /(?:https?:\/\/(?:www\.)?)?vimeo\.com\/(clip\:)?(\d+)/.exec(url);
		cb(matches ? matches.pop() : null, this);
	}

	Player.prototype.setTrackPosition = function(pos) {
		this.post("seekTo", pos);
	};
	
	Player.prototype.embed = function(vars) {
		//console.log("VimeoPlayer embed vars:", vars);
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'viplayer';
		this.trackInfo = {};

		if (USE_FLASH_VIMEO) {
			// inspired by http://derhess.de/vimeoTest/test.html
			var i, embedAttrs, params, innerHTML, objectAttrs, objectHtml, //$embed, $object, // = $(this.element);
				that = this,
				flashvars = {
					server: 'vimeo.com',
					player_server: 'player.vimeo.com',
					api_ready: 'vimeo_ready',
					player_id: this.embedVars.playerId,
					clip_id: vars.videoId,
					title: 0,
					byline: 0,
					portrait: 0,
					fullscreen: 0,
					autoplay: 1,
					js_api: 1
				};

			window.vimeoHandlers = {};

			function setHandlers () {
				for (var evt in EVENT_MAP)
					(function(evt){
						vimeoHandlers[evt] = function(data) {
							//console.log("vimeo event", evt, '=> on'+evt[0].toUpperCase()+evt.substr(1));
							(that.eventHandlers[EVENT_MAP[evt]] || EVENT_MAP[evt])(that, data);
						};
						that.element.api_addEventListener('on'+evt[0].toUpperCase()+evt.substr(1), "vimeoHandlers." + evt);
					})(evt);
				if (that.eventHandlers.onEmbedReady)
					that.eventHandlers.onEmbedReady();
			}

			// CHROME: ready called from here
			embedAttrs = {
			//	id: this.embedVars.playerId,
				src: '//vimeo.com/moogaloop.swf?' + $.param(flashvars).replace(/\&/g, "&amp;"), // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
				type: 'application/x-shockwave-flash',
				classid: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
				allowscriptaccess: "always",
				width: this.embedVars.width || '200',
				height: this.embedVars.height || '200'
			};
			
			window.vimeo_ready = function() {
				//console.log("vimeo embed is ready (embed element)");
				that.otherElement = that.element;
				that.otherElement.setAttribute("id", that.embedVars.playerId + "_");
				that.element = that.otherElement.parentNode.getElementsByTagName("embed")[0];
				that.element.setAttribute("id", that.embedVars.playerId);
				setHandlers();
			}
			window.vimeo_ready_object = function() {
				//console.log("vimeo embed is ready (object element)");
				setHandlers();
			}

			//flashvars.api_ready = 'vimeo_ready_param';
			flashvars.api_ready = 'vimeo_ready_object';

			// IE9: ready called from here
			params = {
				AllowScriptAccess: "always",
				WMode: "opaque",
				FlashVars: $.param(flashvars).replace(/\&/g, "&amp;"),
				Movie: "//vimeo.com/moogaloop.swf?" + $.param(flashvars) //"http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0&amp;time=1350388628283"
			};

			innerHTML = "";
			for (i in params)
				innerHTML += '<param name="'+i.toLowerCase()+'" value="'+params[i]+'">';

			objectAttrs = {
				id: this.embedVars.playerId,
				src: '//vimeo.com/moogaloop.swf?' + $.param(flashvars).replace(/\&/g, "&amp;"), // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
			//	data: 'http://vimeo.com/moogaloop.swf?' + $.param(flashvars), // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
				type: 'application/x-shockwave-flash',
				classid: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
				allowscriptaccess: "always",
				width: this.embedVars.width || '200',
				height: this.embedVars.height || '200'
			};

			objectHtml = "";
			for (i in objectAttrs)
				objectHtml += i + '="' + objectAttrs[i] + '" ';

			// needed by chrome
			innerHTML += "<embed ";
			for (i in embedAttrs)
				innerHTML += i + '="' + embedAttrs[i] + '" ';			
			innerHTML += "></embed>";
			this.embedVars.playerContainer.innerHTML += "<object "+objectHtml+">" + innerHTML + "</object>";

			this.element = document.getElementById(this.embedVars.playerId);
		}
		else { // "universal embed" (iframe)
			this.element = document.createElement("iframe");
			$(this.element).attr({
				id: this.embedVars.playerId,
				width: this.embedVars.width || '200',
				height: this.embedVars.height || '200',
				frameborder: "0",
				webkitAllowFullScreen: true,
				mozallowfullscreen: true,
				allowScriptAccess: "always",
				allowFullScreen: true,
				src: '//player.vimeo.com/video/' + vars.videoId + "?" + $.param({
					api: 1,
					js_api: 1,
					player_id: this.embedVars.playerId,
					title: 0,
					byline: 0,
					portrait: 0,
					autoplay: 1
				})
			}).show();
			if (this.eventHandlers.onEmbedReady)
				this.eventHandlers.onEmbedReady();
		}
	}

	Player.prototype.play = function(id) {
		if (id && (!this.currentId || this.currentId != id)) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	Player.prototype.resume = function() {
		this.post("play");
	}

	Player.prototype.pause = function() {
		this.post("pause");
	}

	Player.prototype.stop = function() {
		this.post("unload");
		if ((this.element || {}).parentNode)
			this.element.parentNode.removeChild(this.element);
		if ((this.otherElement || {}).parentNode)
			this.otherElement.parentNode.removeChild(this.otherElement);
	}

	Player.prototype.setVolume = function(vol) {
		this.post("setVolume", 100 * vol);
	}

	//return Playem;
	//inherits(VimeoPlayer, Player);
	VimeoPlayer.prototype = Player.prototype;
	VimeoPlayer.super_ = Player;
})();
window.$ = window.$ || function(){return window.$};
$.show = $.show || function(){return $};
$.attr = $.attr || function(){return $};

function YoutubePlayer(){
	return YoutubePlayer.super_.apply(this, arguments);
}

(function() {
	//includeJS("https://www.youtube.com/player_api");
	var regex = // /https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/|embed\/|\/)?([a-zA-Z0-9_\-]+)/; //^https?\:\/\/(?:www\.)?youtube\.com\/[a-z]+\/([a-zA-Z0-9\-_]+)/
			/(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/,
		EVENT_MAP = {
			/*YT.PlayerState.ENDED*/ 0: "onEnded",
			/*YT.PlayerState.PLAYING*/ 1: "onPlaying",
			/*YT.PlayerState.PAUSED*/ 2: "onPaused"
		};

	function Player(eventHandlers, embedVars) {
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.label = "Youtube";
		this.isReady = false;
		this.trackInfo = {};
		var that = this;

		window.onYoutubeStateChange = function(newState) {
			//console.log("YT state:", newState);
			if (newState == 1)
				that.trackInfo.duration = that.element.getDuration();
			var eventName = EVENT_MAP[newState];
			if (eventName && that.eventHandlers[eventName])
				that.eventHandlers[eventName](that);
		};

		window.onYoutubeError = function(error) {
			//console.log(that.embedVars.playerId + " error:", error);
			eventHandlers.onError && eventHandlers.onError(that, {source:"YoutubePlayer", code: error});
		}

		window.onYouTubePlayerReady = window.onYouTubePlayerAPIReady = function(playerId) {
			that.element = /*that.element ||*/ document.getElementById(playerId); /* ytplayer*/
			that.element.addEventListener("onStateChange", "onYoutubeStateChange");
			that.element.addEventListener("onError", "onYoutubeError");
		}

		that.isReady = true;
		if (that.eventHandlers.onApiReady)
			that.eventHandlers.onApiReady(that);
	}

	Player.prototype.safeCall = function(fctName, param) {
		try {
			var args = Array.apply(null, arguments).slice(1), // exclude first arg (fctName)
				fct = (this.element || {})[fctName];
			//console.log(fctName, args, this.element)
			fct && fct.apply(this.element, args);
		}
		catch(e) {
			console.error("YT safecall error", e, e.stack);
		}
	}

	Player.prototype.safeClientCall = function(fctName, param) {
		try {
			if (this.eventHandlers[fctName])
				this.eventHandlers[fctName](param);
		}
		catch(e) {
			console.error("YT safeclientcall error", e.stack);
		}
	}

	Player.prototype.embed = function (vars) {
		//console.log("youtube embed:", vars);
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'ytplayer';
		this.trackInfo = {};
		this.element = document.createElement("object");
		this.element.id = this.embedVars.playerId;
		this.embedVars.playerContainer.appendChild(this.element);

		var paramsQS, paramsHTML, embedAttrs, params = {
			autoplay: 1,
			version: 3, 
			enablejsapi: 1,
			playerapiid: this.embedVars.playerId,
			controls: 0,
			modestbranding: 1,
			showinfo: 0,
			wmode: "opaque",
			iv_load_policy: 3, // remove annotations
			//allowFullScreen: "true",
			allowscriptaccess: "always",
			origin: this.embedVars.origin
		};

		paramsQS = Object.keys(params).map(function(k){ // query string
			return k + "=" + encodeURIComponent(params[k]);
		}).join("&");

		paramsHTML = Object.keys(params).map(function(k){
			return '<param name="' + k +'" value="' + encodeURIComponent(params[k]) + '">';
		}).join();

		embedAttrs = {
			id: this.embedVars.playerId,
			width: this.embedVars.width || '200',
			height: this.embedVars.height || '200',
			type: "application/x-shockwave-flash",
			data: window.location.protocol+'//www.youtube.com/v/'+this.embedVars.videoId+'?'+paramsQS,
			innerHTML: paramsHTML
		};
		if (USE_SWFOBJECT) {
        	//swfobject.addDomLoadEvent(function(){console.log("swfobject is ready")});
			swfobject.embedSWF(embedAttrs.data, this.embedVars.playerId, embedAttrs.width, embedAttrs.height, "9.0.0", "/js/swfobject_expressInstall.swf", null, params);
		}
		else {
			$(this.element).attr(embedAttrs);
		}
		$(this.element).show();
		this.safeClientCall("onEmbedReady");
		//this.isReady = true;
	}

	Player.prototype.getEid = function(url, cb) {
		var matches = url.match(regex);
		cb(matches ? matches.pop() : null, this);
	}

	Player.prototype.play = function(id) {
		//console.log("PLAY -> YoutubePlayer", this.currentId, id);
		if (!this.currentId || this.currentId != id) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	Player.prototype.pause = function() {
		//console.log("PAUSE -> YoutubePlayer"/*, this.element, this.element && this.element.pauseVideo*/);
		if (this.element && this.element.pauseVideo)
			this.element.pauseVideo();
	}

	Player.prototype.resume = function() {
		//console.log("RESUME -> YoutubePlayer", this.element, this.element && this.element.playVideo);
		if (this.element && this.element.playVideo)
			this.element.playVideo();
	}
	
	Player.prototype.stop = function() {
		if (this.element && this.element.stopVideo)
			this.element.stopVideo();
		if (USE_SWFOBJECT)
			swfobject.removeSWF(this.embedVars.playerId);
	}
	
	Player.prototype.getTrackPosition = function(callback) {
		if (callback && this.element && this.element.getCurrentTime)
			callback(this.element.getCurrentTime());
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.safeCall("seekTo", pos, true);
	};
	
	Player.prototype.setVolume = function(vol) {
		if (this.element && this.element.setVolume)
			this.element.setVolume(vol * 100);
	};

	//return Player;
	//inherits(YoutubePlayer, Player);
	YoutubePlayer.prototype = Player.prototype;
	YoutubePlayer.super_ = Player;
})();
// configuration

var USE_SWFOBJECT = true, //!!window.swfobject; // ... to embed youtube flash player
	PLAY_TIMEOUT = 10000;

window.$ = window.$ || function(){return window.$};
$.html = $.html || function(){return $};
$.remove = $.remove || function(){return $};

// utility functions

if (undefined == window.console) 
	window.console = {log:function(){}};

loader = new (function Loader() {
	var FINAL_STATES = {"loaded": true, "complete": true, 4: true},
		head = document.getElementsByTagName("head")[0],
		pending = {};
	return {
		includeJS: function(src, cb){
			if (pending[src]) return;
			pending[src] = true;
			var inc = document.createElement("script");
			inc.onload = inc.onreadystatechange = function() {
				if (pending[src] && (!inc.readyState || FINAL_STATES[inc.readyState])) {
					cb && cb();
					delete pending[src];
				}
			};
			inc.src = src;
			head.appendChild(inc);
		}
	};
});

// EventEmitter

function EventEmitter() {
	this._eventListeners = {};
}

EventEmitter.prototype.on = function(eventName, handler){
	this._eventListeners[eventName] = (this._eventListeners[eventName] || []).concat(handler);
}

EventEmitter.prototype.emit = function(eventName){
	var i, args = Array.prototype.slice.call(arguments, 1), // remove eventName from arguments, and make it an array
		listeners = this._eventListeners[eventName];
	for (i in listeners)
		listeners[i].apply(null, args);
}

/**
 * Inherit the prototype methods from one constructor into another. (from Node.js)
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

/**
 * Plays a sequence of streamed audio/video tracks by embedding the corresponding players
 *
 * Events:
 * - "onError", {code,source}
 * - "onReady"
 * - "onPlay"
 * - "onPause"
 * - "onEnd"
 * - "onTrackInfo", track{}
 * - "onTrackChange", track{}
 * - "loadMore"
 */

function Playem(playemPrefs) {

	function Playem(playemPrefs) {

		EventEmitter.call(this);

		playemPrefs = playemPrefs || {};
		playemPrefs.loop = playemPrefs.hasOwnProperty("loop") ? playemPrefs.loop : true;

		var players = [], // instanciated Player classes, added by client
			i,
			exportedMethods,
			currentTrack = null,
			trackList = [],
			whenReady = null,
			playersToLoad = 0,
			progress = null,
			that = this,
			playTimeout = null,
			volume = 1;

		this.setPref = function(key, val){
			playemPrefs[key] = val;
		}

		function doWhenReady(player, fct) {
			var interval = null;
			function poll(){
				if (player.isReady && interval) {
					clearInterval(interval);
					fct();
				}
				else
					console.warn("PLAYEM waiting for", player.label, "...");
			}
			if (player.isReady)
				setTimeout(fct);
			else
				interval = setInterval(poll, 1000);
		}

		function addTrackById(id, player, metadata) {
			if (id) {
				var track = {
					index: trackList.length,
					trackId: id,
					//img: img,
					player: player,
					playerName: player.label.replace(/ /g, "_"),
					metadata: metadata || {}
				};
				trackList.push(track);
				return track;
				//console.log("added:", player.label, "track", id, track/*, metadata*/);
			}
			else
				throw new Error("no id provided");
		}

		function setVolume(vol) {
			volume = vol;
			callPlayerFct("setVolume", vol);
		}

		function stopTrack() {
			if (currentTrack) {
				callPlayerFct("stop");
				if (progress)
					clearInterval(progress);
			}
		}

		function playTrack(track) {
			//console.log("playTrack", track);
			doWhenReady(track.player, function() {
				stopTrack();
				currentTrack = track;
				delete currentTrack.trackPosition; // = null;
				delete currentTrack.trackDuration; // = null;
				that.emit("onTrackChange", track);
				//console.log("playTrack #" + track.index + " (" + track.playerName+ ")", track);
				callPlayerFct("play", track.trackId);
				setVolume(volume);
				if (currentTrack.index == trackList.length-1)
					that.emit("loadMore");
				// if the track does not start playing within 7 seconds, skip to next track
				setPlayTimeout(function() {
					console.warn("PLAYEM TIMEOUT"); // => skipping to next song
					that.emit("onError", {code:"timeout", source:"Playem"});
					//exportedMethods.next();
				});
			});
		}

		function setPlayTimeout(handler) {
			if (playTimeout)
				clearTimeout(playTimeout);
			playTimeout = !handler ? null : setTimeout(handler, PLAY_TIMEOUT);
		}

		function callPlayerFct(fctName, param){
			try {
				return currentTrack.player[fctName](param);
			}
			catch(e) {
				console.warn("Player call error", fctName, e, e.stack);
			}
		}

		// functions that are called by players => to propagate to client
		function createEventHandlers (playemFunctions) {
			var eventHandlers = {
				onApiReady: function(player){
					//console.log(player.label + " api ready");
					if (whenReady && player == whenReady.player)
						whenReady.fct();
					if (0 == --playersToLoad)
						that.emit("onReady");
				},
				onEmbedReady: function(player) {
					//console.log("embed ready");
					setVolume(volume);
				},
				onBuffering: function(player) {
					setTimeout(function() {
						setPlayTimeout();
						that.emit("onBuffering");
					});
				},
				onPlaying: function(player) {
					//console.log(player.label + ".onPlaying");
					//setPlayTimeout(); // removed because soundcloud sends a "onPlaying" event, even for not authorized tracks
					setVolume(volume);
					setTimeout(function() {
						that.emit("onPlay");
					}, 1);
					if (player.trackInfo && player.trackInfo.duration)
						eventHandlers.onTrackInfo({
							position: player.trackInfo.position || 0,
							duration: player.trackInfo.duration
						});

					if (progress)
						clearInterval(progress);

					if (player.getTrackPosition) {
						//var that = eventHandlers; //this;
						progress = setInterval(function(){
							player.getTrackPosition(function(trackPos) {
								eventHandlers.onTrackInfo({
									position: trackPos,
									duration: player.trackInfo.duration || currentTrack.trackDuration
								});
							});
						}, 1000);
					}
				},
				onTrackInfo: function(trackInfo) {
					//console.log("ontrackinfo", trackInfo, currentTrack);
					if (currentTrack && trackInfo) {
						if (trackInfo.duration) {
							currentTrack.trackDuration = trackInfo.duration;
							setPlayTimeout();
						}
						if (trackInfo.position)
							currentTrack.trackPosition = trackInfo.position;          
					}
					that.emit("onTrackInfo", currentTrack);
				},
				onPaused: function(player) {
					//console.log(player.label + ".onPaused");
					setPlayTimeout();
					if (progress)
						clearInterval(progress);
					progress = null;
					//if (!avoidPauseEventPropagation)
					//	that.emit("onPause");
					//avoidPauseEventPropagation = false;
				},
				onEnded: function(player) {
					//console.log(player.label + ".onEnded");
					stopTrack();
					that.emit("onEnd");
					playemFunctions.next();
				},
				onError: function(player, error) {
					console.error(player.label + " error:", ((error || {}).exception || error || {}).stack || error);
					setPlayTimeout();
					that.emit("onError", error);
				}
			};
			// handlers will only be triggered is their associated player is currently active
			["onEmbedReady", "onBuffering", "onPlaying", "onPaused", "onEnded", "onError"].map(function (evt){
				var fct = eventHandlers[evt];
				eventHandlers[evt] = function(player, x){
					if (player == currentTrack.player)
						return fct(player, x);
					else
						console.warn("ignore event:", evt, "from", player, "instead of:", currentTrack.player);
				};
			});
			return eventHandlers;
		}

		// exported methods, mostly wrappers to Players' methods
		exportedMethods = {
			addPlayer: function (playerClass, vars) {
				playersToLoad++;
				players.push(new playerClass(createEventHandlers(this), vars));
			},
			getQueue: function() {
				return trackList;
			},
			clearQueue: function() {
				trackList = [];
			},
			addTrackByUrl: function(url, metadata, cb) {
				var p, remaining = players.length;
				for (p=0; p<players.length; ++p)
					players[p].getEid(url, function(eid, player){
						//console.log("test ", player.label, eid);
						if (eid) {
							var track = addTrackById(eid, player, metadata);
							//console.log("added track", track);
							cb && cb(track);
						}
						else if (--remaining == 0) {
							metadata && $(metadata.post).addClass("disabled");
							throw new Error("unrecognized track: " + url);
						}
					});
			},
			play: function(i) {
				playTrack(i != undefined ? trackList[i] : currentTrack || trackList[0]);
			},
			pause: function() {
				callPlayerFct("pause");
				that.emit("onPause");
			},
			stop: stopTrack,
			resume: function() {
				callPlayerFct("resume");
			},
			next: function() {
				if (playemPrefs.loop || currentTrack.index + 1 < trackList.length)
					playTrack(trackList[(currentTrack.index + 1) % trackList.length]);
			},
			prev: function() {
				playTrack(trackList[(trackList.length + currentTrack.index - 1) % trackList.length]);
			},
			seekTo: function(pos) {
				if ((currentTrack || {}).trackDuration)
					callPlayerFct("setTrackPosition", pos * currentTrack.trackDuration);
			},
			setVolume: setVolume
		};
		//return exportedMethods;
		for (i in exportedMethods)
			this[i] = exportedMethods[i];
	}

	inherits(Playem, EventEmitter);

	return new Playem();
};

