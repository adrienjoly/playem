/**
 * play'em bookmarklet
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
	
	var urlPrefix = findScriptHost("/js/bookmarklet.js") || "http://www.playem.org";
	var urlSuffix = "?" + (new Date()).getTime();
	var minH = 90;
	var minW = 90;
	var scClientId = "9d5bbaf9df494a4c23475d9fde1f69b4;"
	
	var div = document.getElementById("playemBookmarklet");
	if (!div) {
		document.body.appendChild(document.createElement('div')).id = "playemBookmarklet";
		div = document.getElementById("playemBookmarklet");
	}
	div.innerHTML = [
		'<div id="playemHeader">',
			'<a target="_blank" href="'+urlPrefix+'"><img src="'+urlPrefix+'/images/logo-s.png"></a>',
			'<div onclick="document.body.removeChild(document.getElementById(\'playemBookmarklet\'))"><img src="'+urlPrefix+'/images/btn-close.png"></div>',
		'</div>',
		'<div id="playemContent">',
			'<div id="playemLoading">',
				'<p>Extracting images and videos,</p>',
				'<p>please wait...</p>',
				'<img src="'+urlPrefix+'/images/loader.gif">',
			'</div>',
		'</div>'
	].join('\n');
	/*
	function log() {
		try {
			console.log.apply(console, arguments);
		}
		catch (e) {}
	}
	*/
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
			inc = document.createElement("script");
			inc.src = src;
			inc.onload = inc.onreadystatechange = callback || function() {
			};
		}
		document.getElementsByTagName("head")[0].appendChild(inc);
	};
	
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
	
	function showForm(thumb) {
		var text = getSelText();
		var src = urlPrefix+'/bookmarkletForm?embed=' + encodeURIComponent(thumb.url)
			+ '&refUrl=' + encodeURIComponent(window.location.href)
			+ '&refTtl=' + encodeURIComponent(document.title)
			+ (text ? '&text=' + encodeURIComponent(text) : '');
		div.removeChild(contentDiv);
		div.innerHTML += '<iframe id="playemContent" src="'+src+'"></iframe>';
	}
	
	function renderThumb(thumb) {
		var divThumb = document.createElement("div");
		divThumb.setAttribute("id", thumb.id);
		divThumb.setAttribute("class", "playemThumb");
		var divCont = document.createElement("div");
		divCont.setAttribute("class", "playemCont");
		divCont.appendChild(thumb.element);
		var textNode = document.createTextNode(thumb.title);
		var title = document.createElement("p");
		title.appendChild(textNode);
		divThumb.appendChild(divCont);
		divThumb.appendChild(title);
		var btnShareIt = document.createElement("img");
		btnShareIt.setAttribute("src", urlPrefix + "/images/btn-shareit.png");
		divThumb.appendChild(btnShareIt);
		return divThumb;
	}

	var thumbCounter = 0;
	var contentDiv;

	function addThumb(thumb) {
		thumb.id = 'playemThumb' + (thumbCounter++);
		thumb.element = document.createElement("img");
		thumb.element.src = thumb.img;
		var divThumb = renderThumb(thumb);
		divThumb.onclick = function() {showForm(thumb);};
		contentDiv.appendChild(divThumb);
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

	function detectImage(imgElement) {
		var srcUrl = getUrl(imgElement.src);
		if (!srcUrl || imgElement.width < minW || imgElement.height < minH)
			return null;
		var img = new Image();
		img.onload = function() {
			if (img.width > minW && img.height > minH)
				addThumb({
					url: srcUrl,
					img: srcUrl,
					title: "Image ("+img.width+"x"+img.height+")"
				});
		};
		img.src = srcUrl;
		return srcUrl;
	}
	
	var prov = [
		{
			label: "Youtube video",
			regex: /https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/|embed\/|\/)?([a-zA-Z0-9_\-]+)/, //^https?\:\/\/(?:www\.)?youtube\.com\/[a-z]+\/([a-zA-Z0-9\-_]+)/
			getImg: function(id, cb) {
				cb("http://i.ytimg.com/vi/" + id + "/0.jpg");
			}
		},
		{
			label: "Dailymotion video",
			regex: /https?:\/\/(?:www\.)?dailymotion.com\/video\/([\w-_]+)/,
			getImg: function(id, cb) {
				cb("http://www.dailymotion.com/thumbnail/video/" + id);
			}
		},
		{
			label: "Dailymotion video",
			regex: /https?:\/\/(?:www\.)?dailymotion.com\/embed\/video\/([\w-_]+)/,
			getImg: function(id, cb) {
				var callbackFct = "dmCallback_" + id.replace(/[-\/]/g, "__");
				var url = encodeURIComponent("http://www.dailymotion.com/embed/video/"+id); // "k7lToiW4PjB0Rx2Pqxt";
				window[callbackFct] = function(data) {
					cb(data.thumbnail_url);
				};
				include("http://www.dailymotion.com/services/oembed?format=json&url=" + url + "&callback=" + callbackFct);
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
				include("http://vimeo.com/api/v2/video/" + id + ".json?callback="+callbackFct);
			}
		},
		{
			label: "Soundcloud track",
			regex: /https?:\/\/(?:www\.)?soundcloud\.com\/([\w-_\/]+)/,
			getImg: function(id, cb) {
				var callbackFct = "scCallback_" + id.replace(/[-\/]/g, "__");
				var url = encodeURIComponent("http://soundcloud.com/"+id);
				window[callbackFct] = function(data) {
					var trackUrl = decodeURIComponent(/url=([^&]*)&/.exec(data.html)[1]);
					var trackId = trackUrl.split("/").pop();
					window[callbackFct] = function(data) {
						cb(data.artwork_url);
					};
					include("http://api.soundcloud.com/tracks/" + trackId + ".json?client_id="+scClientId+"&callback="+callbackFct);
				};
				include('http://soundcloud.com/oembed?url='+url+'&format=js&iframe=true&callback=' + callbackFct);
			}
		}
	];
	
	function addEmbedThumb(e, p) {
		var found = false;
		var matches;
		var src = e.src || e.data;
		if(found = (matches = p.regex.exec(src)))
			p.getImg(matches.pop(), function(img){ //[1]
				addThumb({
					url: src,
					img: img,
					title: p.label
				});
			})
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
		count += forEachElement("img", detectImage);
		document.getElementById("playemLoading").innerHTML = count ? ""
			: "No images and videos were found on this page, sorry...";
	}
	/*
	(function loadNext(){
		if (toInclude.length)
			include(urlPrefix + toInclude.shift() + urlSuffix, loadNext);
		else initplayemBookmarklet();
	})();
	*/
	include(urlPrefix + "/bookmarklet.css" + urlSuffix, initplayemBookmarklet);
})();