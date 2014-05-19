function select_all(el) {
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.selection != "undefined" && typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.select();
    }
}

function makeTracklistPlayer(p, cb){

	var $log = $("<div id='debuglog' style='position:fixed;top:0;left:40%;width:60%;height:100%;overflow:auto;background:rgba(0,0,0,0.8);padding:5px;font-size:10px;'>").appendTo("body");
	var $btn = $('<button>select text</button>').css({position:"fixed",top:0,right:0}).appendTo("body").click(function(){
		select_all(document.getElementById("debuglog"));
	});

	function htmlEntities(str) {
	    return String(str || "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	function makeColorConsole(fct, css){
		return function(){
			fct.apply(console, arguments);
			for (var i in arguments)
				if (arguments[i] instanceof Object || arguments[i] instanceof Array)
					arguments[i] = JSON.stringify(arguments[i]);
			$('<p>' + htmlEntities(Array.prototype.join.call(arguments, " ")) + '</p>').css(css).appendTo($log);
			$log[0].scrollTop = $log[0].scrollHeight;
		};
	}

	console.log = makeColorConsole(console.log, {margin:0, color:"#aaaaaa"});
	console.warn0 = makeColorConsole(console.warn, {margin:0, color:"#33aa33"});
	console.warn1 = makeColorConsole(console.warn, {margin:0, color:"#aaaa33"});
	console.warn2 = makeColorConsole(console.warn, {margin:0, color:"#aa3333"});

	loadJS("/pl-all/main.js",function(){
		window.DEBUG = true; // for soundmanager

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
					var metadata = {
						i: playem.getQueue().length,
						//eId: embedId,
						url: fbItem.link,
						name: fbItem.name,
						desc: fbItem.description,
						from: fbItem.from,
						time: fbItem.updated_time,
						msg: fbItem.message,
						fbUrl: (fbItem.actions || []).length && fbItem.actions[0].link
					}
					try {
						playem.addTrackByUrl(fbItem.link, metadata);
						console.warn0("PLAY " + fbItem.link);
						return metadata;
					} catch(e) {
						if (/youtube\.com/.test(fbItem.link))
							console.warn2("SKIP " + fbItem.link);
						else if (!/https\:\/\/www\.facebook\.com\/[a-zA-Z0-9\/\-\_\.]*photo/.test(fbItem.link))
							console.warn1("SKIP " + fbItem.link);
					};
				},
				play: function(index){
					//this.current = this.vids[index];
					//playem.stop();
					//playem.play(index);
				},
				next: function(){
					//playem.next();
				}
			};
		}

		loadSoundManager(function(){
			initPlayem(document.getElementById(p.videoContainer), "videoPlayer", function(playem){
				cb(new PlayemWrapper(playem));
			});
		});
	});
};
