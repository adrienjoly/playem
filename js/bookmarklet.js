/**
 * play'em bookmarklet v1.1
 * @author adrienjoly
 **/

(function(){
	
	function forEachElement (elementName, handler) {
		var els = document.getElementsByTagName(elementName);
		var l = 0 + els.length;
		var count = 0;
		for(var i = 0; i < l; i++)
			count += handler(els[i]);
		return count;
	}
	
	function findScriptHost(scriptPathName) {
		var host = null;
		forEachElement("script", function(element) {
			var playemPathPos = element.src.indexOf(scriptPathName);
			if(playemPathPos > -1)
				host = element.src.substr(0, playemPathPos);
		});
		return host;
	}
	
	// PARAMETERS

	var player = null;
	var currentVideo = null;

	var urlPrefix = findScriptHost("/js/bookmarklet.js") || "https://adrienjoly.com/playem";
	var urlSuffix = "?" + (new Date()).getTime();
	//var scClientId = "9d5bbaf9df494a4c23475d9fde1f69b4";
	var body = document.getElementsByTagName("body")[0];
	body.className = (body.className || "") + " playemParent";
	
	var div = document.getElementById("playemBookmarklet");
	if (!div) {
		document.body.appendChild(document.createElement('div')).id = "playemBookmarklet";
		div = document.getElementById("playemBookmarklet");
	}
	div.innerHTML = [
		'<div id="playemHeader">',
			'<a target="_blank" href="'+urlPrefix+'"><img src="'+urlPrefix+'/favicon.png"><span>Play\'em</span></a>',
			'<div onclick="document.body.removeChild(document.getElementById(\'playemBookmarklet\'))"><img src="'+urlPrefix+'/ui-default/img/x.png"></div>',
		'</div>',
		'<div id="ytplayer"></div>',
		'<div id="playemContent">',
			'<div id="playemLoading">',
				'<p>Extracting videos,</p>',
				'<p>please wait...</p>',
				'<img src="'+urlPrefix+'/ui-default/img/loader.gif">',
			'</div>',
		'</div>'
	].join('\n');
	
	function log() {
		try {
			console.log.apply(console, arguments);
		}
		catch (e) {}
	}
	
	function include(src, callback) {
		var ext = src.split(/[\#\?]/)[0].split(".").pop().toLowerCase();
		var inc;
		if (ext == "css") {
			inc = document.createElement("link");
			inc.rel = "stylesheet";
			inc.type = "text/css";
			inc.media = "screen";
			inc.href = src;
			if (callback)
				callback ();
		}
		else{
			//log("loading js ", src)
			inc = document.createElement("script");
			inc.onload = inc.onreadystatechange = callback || function() {};
			inc.src = src;
		}
		document.getElementsByTagName("head")[0].appendChild(inc);
	};
	/*
	function getSelText() {
		var SelText = '';
		if (window.getSelection) {
			SelText = window.getSelection();
		} else if (document.getSelection) {
			SelText = document.getSelection();
		} else if (document.selection) {
			SelText = document.selection.createRange().text;
		}
		return SelText;
	}
	*/
	function playVideo(thumb) {
		if (player)
			player.loadVideoById(thumb.videoId);
		else
			player = new YT.Player('ytplayer', {
				width: '200',
				height: '200',
				videoId: thumb.videoId, //'u1zgFlCw8Aw'
				playerVars: {
					autoplay: 1,
					controls: 0
				},
				events: {
					onStateChange: function(event) {
						if (event.data == YT.PlayerState.ENDED) {
							playVideo(videoList[currentVideo.index+1]);
						}
					}
				}
			});
		currentVideo = thumb;
	}
	
	function renderThumb(thumb) {
		var divThumb = document.createElement("li");
		divThumb.setAttribute("id", thumb.id);
		divThumb.appendChild(thumb.element);
		divThumb.appendChild(document.createTextNode(thumb.title));
		return divThumb;
	}

	var thumbCounter = 0;
	var videoSet = {};
	var videoList = [];
	var contentDiv;

	function addThumb(thumb) {
		//console.log(thumbCounter)
		thumb.index = (thumbCounter++);
		thumb.id = 'playemThumb' + thumb.index;
		thumb.element = document.createElement("img");
		thumb.element.src = thumb.img;
		thumb.div = renderThumb(thumb);
		thumb.div.onclick = function() {playVideo(thumb);};
		contentDiv.appendChild(thumb.div);
		return thumb;
	}
	
	var pagePrefix = window.location.href.split(/[#\?]/).shift();
	var posPrefix = pagePrefix.lastIndexOf("/");
	pagePrefix = pagePrefix.substr(0, posPrefix) + "/";
	var pageRoot = pagePrefix.substr(0, pagePrefix.indexOf("/", 10));
	
	function getUrl(path) {
		if (path && path.length > 0 && path.indexOf("://") == -1)
			return (path[0] == "/" ? pageRoot : pagePrefix) + path;
		else
			return path;
	}

	var prov = [
		{
			label: "Youtube video",
			regex: /https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/|embed\/|\/)?([a-zA-Z0-9_\-]+)/, //^https?\:\/\/(?:www\.)?youtube\.com\/[a-z]+\/([a-zA-Z0-9\-_]+)/
			getImg: function(id, cb) {
				cb("https://i.ytimg.com/vi/" + id + "/0.jpg");
			}
		}/*,
		{
			label: "Dailymotion video",
			regex: /https?:\/\/(?:www\.)?dailymotion.com\/video\/([\w-_]+)/,
			getImg: function(id, cb) {
				cb("https://www.dailymotion.com/thumbnail/video/" + id);
			}
		},
		{
			label: "Dailymotion video",
			regex: /https?:\/\/(?:www\.)?dailymotion.com\/embed\/video\/([\w-_]+)/,
			getImg: function(id, cb) {
				var callbackFct = "dmCallback_" + id.replace(/[-\/]/g, "__");
				var url = encodeURIComponent("https://www.dailymotion.com/embed/video/"+id); // "k7lToiW4PjB0Rx2Pqxt";
				window[callbackFct] = function(data) {
					cb(data.thumbnail_url);
				};
				include("https://www.dailymotion.com/services/oembed?format=json&url=" + url + "&callback=" + callbackFct);
			}
		},
		{
			label: "Vimeo video",
			regex: /https?:\/\/(?:www\.)?vimeo\.com\/(clip\:)?(\d+)/,
			getImg: function(id, cb) {
				var callbackFct = "viCallback_" + id;
				window[callbackFct] = function(data) {
					cb(data[0].thumbnail_medium);
				};
				include("https://vimeo.com/api/v2/video/" + id + ".json?callback="+callbackFct);
			}
		},
		{
			label: "Soundcloud track",
			regex: /https?:\/\/(?:www\.)?soundcloud\.com\/([\w-_\/]+)/,
			getImg: function(id, cb) {
				var callbackFct = "scCallback_" + id.replace(/[-\/]/g, "__");
				var url = encodeURIComponent("https://soundcloud.com/"+id);
				window[callbackFct] = function(data) {
					var trackUrl = decodeURIComponent(/url=([^&]*)&/.exec(data.html)[1]);
					var trackId = trackUrl.split("/").pop();
					window[callbackFct] = function(data) {
						cb(data.artwork_url);
					};
					include("https://api.soundcloud.com/tracks/" + trackId + ".json?client_id="+scClientId+"&callback="+callbackFct);
				};
				include('https://soundcloud.com/oembed?url='+url+'&format=js&iframe=true&callback=' + callbackFct);
			}
		}*/
	];

	//var done = false;

	function unwrapFacebookLink(src) {
		// e.g. https://www.facebook.com/l.php?u=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DKhXn0anD1lE&h=AAQFjMJBoAQFTPOP4HzFCv0agQUHB6Un31ArdmwvxzZxofA
		var fbLink = src.split("facebook.com/l.php?u=");
		if (fbLink.length) {
			fbLink = fbLink.pop().split("&").shift();
			src = decodeURIComponent(fbLink);
			//console.log(src);
		}
		return src;
	}
	
	function addEmbedThumb(e, p) {
		var found = false;
		var matches;
		var src = (e.dataset || {}).eid;//e.getAttribute("data-eid");
		/*
		if (e.onclick && (""+e.onclick).indexOf("replace") > -1 && !done) {
			console.log();
			for (var i in e)
				console.log(i, e[i]);
			done = true;
		}
		*/
		src = src ? (""+src).replace("/yt/", "https://youtube.com/v/") : e.src || e.data || e.href || "";

		src = unwrapFacebookLink(src);

		if(found = (matches = p.regex.exec(src))) {
			var id = matches.pop();
			if (id && !videoSet[id])
				p.getImg(id, function(img){
					videoList.push(videoSet[id] = addThumb({
						videoId: id,
						url: src,
						img: img,
						title: p.label
					}));
					//console.log("detected", id, e.tagName, videoSet[id]);
				});
		}
		return found;
	}

	function detectEmbed(e) {
		var found = false;
		for (var p=0; p<prov.length; ++p)
			found += addEmbedThumb(e, prov[p]);
		return found;
	}
	
	function initplayemBookmarklet() {
		contentDiv = document.getElementById("playemContent");
		var count = 0;
		count += detectEmbed({src:window.location.href});
		count += forEachElement("iframe", detectEmbed);
		count += forEachElement("object", detectEmbed);
		count += forEachElement("embed", detectEmbed);
		count += forEachElement("a", detectEmbed);
		document.getElementById("playemLoading").innerHTML = count ? ""
			: "No images and videos were found on this page, sorry...";
		log("end of video detection");
		include("https://www.youtube.com/player_api", function() {
			setTimeout(window.onYouTubePlayerAPIReady, 10);
		});
	}
	/*
	(function loadNext(){
		if (toInclude.length)
			include(urlPrefix + toInclude.shift() + urlSuffix, loadNext);
		else initplayemBookmarklet();
	})();
	*/

	window.onYouTubePlayerReady = window.onYouTubePlayerAPIReady = function() {
		log("youtube ready");
		playVideo(videoList[0]);
	}
	
	include(urlPrefix + "/bookmarklet.css" + urlSuffix, initplayemBookmarklet);

	// load parse (for analytics)
	function useParse() {
		Parse.initialize('s43DxuFga8rI9FcLR38MSYoQ2kXFaMmsfg14PHck', 'Uaba3nQPQnVJWk7df3e8Hb0E4r2Dop96aHCCk1BC');
		console.log('playem bk: polling parse...');
		//Parse.Analytics.track('ran-bookmarket-from', { url: window.location.href });
		var Session = Parse.Object.extend('bksessions');
		var bksession = new Session();
		bksession.set('fromUrl', window.location.href);
		bksession.save(null, {
		  success: function() {
				console.log('playem bk: parse => ok');
			},
			error: function(res, err) {
				console.log('playem bk: parsed failed:', err.message, err);
			}
		});
	}
	try {
		useParse();
	} catch(e) {
		include('//www.parsecdn.com/js/parse-1.6.7.min.js', useParse);
	}

	// load google analytics
	var _gaq = _gaq || [];
	_gaq.push(['_setAccount', 'UA-1858235-3']);
	_gaq.push(['_trackPageview', '/js/bookmarklet.js']);
	(function() {
		var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	})();

})();
