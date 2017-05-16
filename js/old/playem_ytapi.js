$(function() {

	if (undefined == window.console) 
		console = { log:function(){} };
		
	console.log("playem init");
	
	var //user = null,
	current = null,
	vids = [],
	feedOffset = 0,
	playlist = $("#playlist"),
	youtubeRegex = ///^http[s]?\:\/\/(www\.)?youtu(\.)?be(\.com)?\/(watch\?v=)?(v\/)?([a-zA-Z0-9_\-]+)/;
			/(https?\:\/\/(www\.)?youtu(\.)?be(\.com)?\/.*(\?v=|\/v\/)([a-zA-Z0-9_\-]+).*)/g;

    var player;

	//FB.Flash.hasMinVersion = function () { return false; };
	
	var addVid = function (fbItem) {
		var vidUrl = fbItem.link;
		var vid = youtubeRegex.exec(vidUrl); //vidUrl.match(youtubeRegex);
		if (vid && vid.length > 0) {
			vid = vid.pop();
			vid = {
				i:vids.length, 
				id:vid, 
				name:fbItem.name, 
				desc:fbItem.description,
				url:'https://www.youtube.com/v/' + vid + '?enablejsapi=1&fs=1&autoplay=1', // /embed/
				from:fbItem.from, 
				time:fbItem.updated_time, 
				msg:fbItem.message,
				fbUrl:fbItem.actions[0].link
			};
			vid.li = $("<li>"+vid.name+"</li>").click(function() {
				playVid(vid)
			}).appendTo(playlist);
			vids.push(vid);
		}
	};
  
	var playVid = function (vid) {
		$("li").css('color', 'gray');
		$("#playCursor").remove();
		window.current = current = vid;
		current.li.css('color', 'white').prepend("<span id='playCursor'>► </span>");
		$("#socialPane").html('<p>Shared by:</p><img src="https://graph.facebook.com/' + vid.from.id + '/picture"/>'
			+ '<p>' + vid.from.name + (vid.msg ? ": " + vid.msg : "") + '</p>'
			+ '<p class="timestamp"><a href="'+vid.fbUrl+'" title="comment on facebook">' +vid.time + '</a></p>'
			+ '<span class="postShareFB" onclick="shareVideo()">&nbsp;</span>')
		/*
		$('#videoEmbed').replaceWith('<iframe id="videoEmbed" width="425" height="344" frameborder="0" class="youtube-player" type="text/html" ></iframe>');
			var iframeElement = document.getElementById('videoEmbed');
    		var iframeWindow = iframeElement.contentWindow;
    		iframeWindow.onytplayerStateChange = window.onytplayerStateChange;
    		iframeWindow.onYouTubePlayerReady = window.onYouTubePlayerReady;
    		iframeElement.src = vid.url;
    		iframeWindow.onytplayerStateChange = window.onytplayerStateChange;
    		iframeWindow.onYouTubePlayerReady = window.onYouTubePlayerReady;
    	*/
    	
        player.stopVideo();
        player.loadVideoById(vid.id);
        player.playVideo();
        
		window.playNext = function() {
			playVid(current = vids[vid.i+1 % vids.length]);
		};  
	};
	
    var remaining = 2; // youtube activation and page ready
    function startWhenReady() {
    	console.log("start when ready", remaining);
    	if (--remaining == 0)
    		loadMore();
    };
	
    var loadYoutube = function(callback) {
	    window.onYouTubePlayerAPIReady = function(playerId) {
	    	console.log("youtube is ready");
	        player = new YT.Player('videoEmbed', {
	          height: '344',
	          width: '425',
	          //videoId: 'JW5meKfy3fY',
	          //playerVars : { 'autoplay': 1 },
	          events: {/*
	            'onReady': function(evt) {
			    	console.log("ready");
			        evt.target.playVideo();
			    },*/
	            'onStateChange': function(evt) {
			    	console.log("state");
					if (evt.data == 0) // end of video
						playNext();
			    }
	          }
	        });
	        callback();
	    }
	    
		//Load player api asynchronously
		console.log("loading youtube api");
	    var tag = document.createElement('script');
	    tag.src = "https://www.youtube.com/player_api";
	    var firstScriptTag = document.getElementsByTagName('script')[0];
	    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	    // 
    }


/*
	window.onytplayerStateChange = function (newState) {
		console.log("newState", newState);
		if (newState == 0) // end of video
			playNext();
	};

	window.onYouTubePlayerReady = function (playerId) {
		console.log("ready");
		var embed = document.getElementById("videoEmbed");
		embed.addEventListener("onStateChange", "onytplayerStateChange");
	};
*/
	window.shareVideo = function() {
		var vid = window.current;
		FB.ui({
				method: 'feed',
				message: "I have found this great video shared by " + vid.from.name + ", thanks to Play'em!",
				name: vid.name,
				link: 'https://adrienjoly.com/playem/#yt='+vid.id,
				picture: 'https://i.ytimg.com/vi/' + vid.id + '/0.jpg', //'https://adrienjoly.com/playem/playem.png',
				caption: "I have found this great video shared by " + vid.from.name + ", thanks to Play'em!",
				description: "Play'em is a simple way to watch the cool videos you friends share on Facebook. Play in one click, no browsing required, just like TV!",
				actions:  {name:'Watch Play\'em TV', link:'https://adrienjoly.com/playem/'}
			},
			function(response) {
				if (response && response.post_id) {
					//alert('Post was published.');
				} else {
					//alert('Post was not published.');
				}
			}
		);
	};
	
	var loadMore = function(until) {
		//console.log("loadMore", feedOffset, until);
		var params = until ? {
			until:until
		} : {};
		FB.api('/me/home', params, function(feed) {
			for (var i in feed.data) {
				/*console.log*/(i = feed.data[i]);
				if (i.type=="video" && i.link)
					addVid(i);
			}
			if (!current && vids.length > 0)
				playVid(vids[0]);
        
			feedOffset += feed.data.length;
			if (feed.data.length > 0 /*&& vids.length < 10 && feedOffset < 200*/)
				loadMore(feed.paging.next.substr(feed.paging.next.lastIndexOf("=")+1));
		});
	};
  
	// called when the user clicks the facebook connect button

	var onFacebookSessionEvent = function(response) {
		console.log("facebook response", response);
		if (response.session || response.authResponse) {
			$("#welcome").hide();
			$("#container").show();
			loadMore();
		}
		else {
			$("#welcome").show();
			$("#container").hide();
			user = null;
		}
	};

	login = function(nextPage) {
		var handler = nextPage ? function(){
			window.location.href = nextPage;
		} : onFacebookSessionEvent;
		console.log("FB.login...");
		FB.login(handler, {
			scope:'read_stream'
		});
	};

	// called when a video link is attached to the URL (e.g. from facebook shared link)

	var openVideoOverlay = function(videoUrl) {
		swfobject.embedSWF(videoUrl, 'modalEmbed', '425', '344', '9.0.0', '', flashvars, params, attributes);
		$('#modalEmbed').modal({
			overlayClose:true,
			overlayCss:{"background-color":"black"},
			containerCss:{ height:"350px", width:"430px", filter:"alpha(opacity=100)", "-moz-opacity":1, opacity:1},
				onOpen: function (dialog) {
					dialog.overlay.fadeIn('fast', function () {
						dialog.container.fadeIn('fast', function () {
							dialog.data.show();
						});
					});
				}
		});
	}
  
	var ytLink = window.location.href.indexOf("yt=");
	if (ytLink > 0)
		openVideoOverlay('https://www.youtube.com/v/' + window.location.href.substr(ytLink+3));
	else
		loadYoutube(startWhenReady);
});

