function makeTracklistPlayer(p, cb){

	var $log = $("<div id='debuglog' style='position:fixed;top:0;left:40%;width:60%;height:100%;overflow:auto;background:rgba(0,0,0,0.8);color:#00ff00;padding:5px;'>").appendTo("body");

	$log.append("coucou<br>");

	function htmlEntities(str) {
	    return String(str || "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	console = {
		log: (function makeColorConsole(fct, color){
				return function(){
					for (var i in arguments)
						if (arguments[i] instanceof Object || arguments[i] instanceof Array)
							arguments[i] = JSON.stringify(arguments[i]);
					fct.call(console, htmlEntities(Array.prototype.join.call(arguments, " ")) + "<br>");
				};
			})(console.log)
	};

	console.log("ouais"); //, {cool:true}, 34, "yeah!");

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
						console.log("PLAY " + fbItem.link);
						return metadata;
					} catch(e) {
						console.log("SKIP " + fbItem.link);
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
