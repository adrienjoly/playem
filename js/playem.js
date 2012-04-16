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

	var flashvars = {
		autoplay:1
	}, attributes = {};
	var params = {
		allowFullScreen: "true",
		allowscriptaccess: "always",
		autoplay: 1,
		wmode: "opaque"
	};
	
	//FB.Flash.hasMinVersion = function () { return false; };
	/*
	console.log("FB.init...");

	FB.init({
		appId: "143116132424011", 
		status: true, 
		cookie: true, 
		xfbml: true,
		oauth : true
		//channelUrl : 'http://www.playem.org/channel.html'
	});
	*/
	
	/*
	//Load player api asynchronously.
    var tag = document.createElement('script');
    tag.src = "http://www.youtube.com/player_api";
    var firstScriptTag = document.getElementById('script');
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var player;
    */

  
	var addVid = function (fbItem) {
		var vidUrl = fbItem.link;
		//console.log(vidUrl);
		var vid = youtubeRegex.exec(vidUrl); //vidUrl.match(youtubeRegex);
		if (vid && vid.length > 0) {
			vid = vid.pop();
			vid = {
				i:vids.length, 
				id:vid, 
				name:fbItem.name, 
				desc:fbItem.description,
				url:'http://www.youtube.com/v/' + vid + '?enablejsapi=1&fs=1&autoplay=1', // /embed/
				from:fbItem.from, 
				time:fbItem.updated_time, 
				msg:fbItem.message,
				fbUrl:fbItem.actions[0].link
			};
			//console.log("adding", vid.name, vid);
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
		//console.log("playing", vid.name);
		current.li.css('color', 'white').prepend("<span id='playCursor'>► </span>");
		$("#socialPane").html('<p>Shared by:</p><img src="http://graph.facebook.com/' + vid.from.id + '/picture"/>'
			+ '<p>' + vid.from.name + (vid.msg ? ": " + vid.msg : "") + '</p>'
			+ '<p class="timestamp"><a href="'+vid.fbUrl+'" title="comment on facebook">' +vid.time + '</a></p>'
			+ '<span class="postShareFB" onclick="shareVideo()">&nbsp;</span>')
		swfobject.embedSWF(vid.url, 'videoEmbed', '425', '344', '9.0.0', '', flashvars, params, attributes);
		/*
		$('#videoEmbed').replaceWith('<iframe id="videoEmbed" src="'+vid.url+'" width="425" height="344" frameborder="0" class="youtube-player" type="text/html" ></iframe>');
    		var iframeWindow = document.getElementById('videoEmbed').contentWindow;
    		console.log(iframeWindow);
    		iframeWindow.onytplayerStateChange = window.onytplayerStateChange;
    		iframeWindow.onYouTubePlayerReady = window.onYouTubePlayerReady;
    	*/
    	/*
        player.stopVideo();
        player.loadVideoById(vid.id);
        player.playVideo();
        */
		//iframeWindow.playNext =
		window.playNext = function() {
			//console.log("playNext");
			playVid(current = vids[vid.i+1 % vids.length]);
		};  
	};
	
	/*
    function onPlayerReady(evt) {
    	console.log("ready");
        evt.target.playVideo();
    }
    function onPlayerStateChange(evt) {
		if (evt.data == 0) // end of video
			playNext();
    }
    
    function onYouTubePlayerAPIReady() {
    	console.log("ready1");
        player = new YT.Player('videoEmbed', {
          height: '344',
          width: '425',
          //videoId: 'JW5meKfy3fY',
          //playerVars : { 'autoplay': 1 },
          events: {
            //'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
        startWhenReady();
    }
    
    var remaining = 2; // youtube activation and page ready
    function startWhenReady() {
    	console.log("start when ready", remaining);
    	if (--remaining == 0)
    		loadMore();
    };
    */


/**/
	window.onytplayerStateChange = function (newState) {
		//console.log("newState", newState);
		if (newState == 0) // end of video
			playNext();
	};

	window.onYouTubePlayerReady = function (playerId) {
		var embed = document.getElementById("videoEmbed");
		embed.addEventListener("onStateChange", "onytplayerStateChange");
	};
/**/
	window.shareVideo = function() {
		var vid = window.current;
		FB.ui({
				method: 'feed',
				message: "I have found this great video shared by " + vid.from.name + ", thanks to Play'em!",
				name: vid.name,
				link: 'http://www.playem.org/#yt='+vid.id,
				picture: 'http://i.ytimg.com/vi/' + vid.id + '/0.jpg', //'http://playem.org/playem.png',
				caption: "I have found this great video shared by " + vid.from.name + ", thanks to Play'em!",
				description: "Play'em is a simple way to watch the cool videos you friends share on Facebook. Play in one click, no browsing required, just like TV!",
				actions:  {name:'Watch Play\'em TV', link:'http://playem.org/'}
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
	
	var modalDialogParams = {
		overlayClose:true,
		onOpen: function (dialog) {
			dialog.overlay.fadeIn('fast', function () {
				dialog.data.hide();
				dialog.container.fadeIn('fast', function () {
					dialog.data.slideDown('fast');
				});
			});
		}
	};

	var modalContentParams = {
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
	};

	function openVideoOverlay(videoUrl) {
		swfobject.embedSWF(videoUrl, 'modalEmbed', '425', '344', '9.0.0', '', flashvars, params, attributes);
		$('#modalEmbed').modal(modalContentParams);
	}
  
	var loadMore = function(until) {
		console.log("loadMore", feedOffset, until);
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
			//perms:'read_stream', // legacy
			scope:'read_stream'  // oauth 2.0
		});
	};
  
	var ytLink = window.location.href.indexOf("yt=");
	if (ytLink > 0)
		openVideoOverlay('http://www.youtube.com/v/' + window.location.href.substr(ytLink+3));
	else if (window.startOnLoad)
		//startWhenReady();
		loadMore();
});
