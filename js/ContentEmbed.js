/**
 * ContentEmbed
 * a class for embedding content from whyd and other web sites: youtube, dailymotion, vimeo, soundcloud...
 * @author adrienjoly, whyd
 */

function ContentEmbed (params) {

	var domain = window.location.href;
	domain = domain.substr(0, domain.indexOf("/", 10));
	//domain = domain.substr(0, domain.indexOf(":", 10));

	params = params || {};
	params.detectTypes = params.detectTypes || ["yt", "dm", "vi", "sc", "wy"];
	params.ignoreContentType = params.ignoreContentType || false;
	params.domain = params.domain || domain;

	var generalUrl = /\b(?:https?|ftp|file):\/\/[-A-Z0-9+&@#$*'()\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/ig;
	var scClientId = "9d5bbaf9df494a4c23475d9fde1f69b4;"
	
	var getContentType = params.ignoreContentType ? function (url, callback) {
		callback();
	} : function (url, callback) {
		$.ajax({type: "GET",
			url: "/contentType",
			data: {url: url},
			success: function(type) {callback(type, url);}
		});
	}
	
	var imageEmbed = {
		getHref: function(embedRef) {
			return embedRef.url;
		},
		render: function(embedRef, options, callback) {
			var html = '<img src="'+embedRef.url+'"/>';
			if (callback) callback(html);
			return html;
		}
	};
	
	var pageEmbed = {
		getHref: function(embedRef) {
			return embedRef.url;
		},
		getImages: function(embedRef, imgCallback) {
			function loadImage(i) {
				var img = new Image();
				img.onload = function() {
					imgCallback({
						url: img.src,
						width: img.width,
						height: img.height
					});
				}
				img.src = embedRef.images[i];
			}
			if (embedRef.images)
				for (var i in embedRef.images)
					loadImage(i);
		},
		render: function(embedRef, options, callback) {
			var html = '<a href="'+embedRef.url+'">'
					 + (embedRef.images ? '<img src="'+embedRef.images[0]+'"/>' : '')
					 + embedRef.name
					 + '</a>';
			if (callback) callback(html);
			return html;
		}
	};
	
	var embedDefaults = {
		autoplay: true,
		width: 360, //425,
		height: 270 //344
	}
	
	var youtubeEmbed = {
		whydPrefix: "yt",
		//regex: /https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/)?([a-zA-Z0-9_\-]+)/,
		regex: /https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/|embed\/|\/)?([a-zA-Z0-9_\-]+)/,
		getHref: function(embedRef) {
			return 'https://www.youtube.com/v/' + embedRef.videoId;
		},
		renderImg: function(embedRef, callback) {
			return '<img src="'+embedRef.img+'" title="'+embedRef.name+'" />';
		},
		require: function(embedRef, callback) {
			embedRef.img = 'https://i.ytimg.com/vi/' + embedRef.videoId + '/0.jpg';
			$.getJSON("https://gdata.youtube.com/feeds/api/videos/"+embedRef.videoId+"?v=2&alt=jsonc&callback=?", function(data) {
				//console.log("youtube api response", data);
				if (data && data.data)
					embedRef.name = data.data.title;
				//else
				//	console.log("youtube response error: ", data);
				callback(embedRef);
			});
		},
		render: function(embedRef, options, callback) {
			var options = options || embedDefaults;
			var url = "https://youtube.com/embed/" + embedRef.videoId + '?enablejsapi=1&amp;fs=1&amp;wmode=opaque&amp;autoplay=' + (options.autoplay ? 1 : 0) + "&amp;origin=" + params.domain;
			var html = '<iframe src="'+url+'" width="'+options.width+'" height="'+options.height+'" frameborder="0" class="youtube-player" type="text/html" ></iframe>';
			if (callback) callback(html)
			return html;
		}
	};
	
	var dailymotionEmbed = {
		whydPrefix: "dm",
		regex: /https?:\/\/(?:www\.)?dailymotion.com\/video\/([\w-_]+)/,
		getHref: function(embedRef) {
			return 'https://www.dailymotion.com/swf/' + embedRef.videoId;
		},
		renderImg: function(embedRef, callback) {
			return '<img src="https://www.dailymotion.com/thumbnail/video/' + videoId+'" />';
		},
		require: function(embedRef, callback) {
			embedRef.img = 'https://www.dailymotion.com/thumbnail/video/' + embedRef.videoId + '/0.jpg';
			callback(embedRef);
		},
		render: function(embedRef, options, callback) {
			options = options || embedDefaults;
			var url = "https://www.dailymotion.com/swf/" + embedRef.videoId + '?autoPlay='+options.autoplay+'&related=0';
			var html = '<iframe src="'+url+'" width="'+options.width+'" height="'+options.height+'" frameborder="0" type="text/html" ></iframe>';
			if (callback) callback(html)
			return html;
		}
	};
	
	var dailymotionEmbed2 = {
		whydPrefix: "dm",
		regex: /https?:\/\/(?:www\.)?dailymotion.com\/embed\/video\/([\w-_]+)/,
		getHref: function(embedRef) {
			return embedRef.url; //'http://www.dailymotion.com/swf/' + embedRef.videoId;
		},
		renderImg: function(embedRef, callback) {
			return '<img src="https://www.dailymotion.com/thumbnail/video/' + videoId+'" />';
		},
		require: function(embedRef, callback) {
			var url = encodeURIComponent(embedRef.url); // "http://www.dailymotion.com/embed/video/k7lToiW4PjB0Rx2Pqxt";
			$.getJSON("https://www.dailymotion.com/services/oembed?format=json&url=" + url + "&callback=?", function(data){
				embedRef.img = data.thumbnail_url;//.replace("_preview_medium", "_preview_large");
				embedRef.name = data.title;
				embedRef.url = /src=\"([^\"]*)\"/.exec(data.html);
				if (embedRef.url && embedRef.url.length == 2) {
					embedRef.videoId = decodeURIComponent(embedRef.url[1]);
					embedRef.videoId = embedRef.videoId.split("/").pop();
					callback(embedRef);
				}
				else
					callback(embedRef);
			});
		},
		render: function(embedRef, options, callback) {
			options = options || embedDefaults;
			var url = "https://www.dailymotion.com/swf/" + embedRef.videoId + '?autoPlay='+options.autoplay+'&related=0';
			var html = '<iframe src="'+url+'" width="'+options.width+'" height="'+options.height+'" frameborder="0" type="text/html" ></iframe>';
			if (callback) callback(html)
			return html;
		}
	};
	
	var vimeoEmbed = {
		whydPrefix: "vi",
		regex: /https?:\/\/(?:www\.)?vimeo\.com\/(clip\:)?(\d+)/, // http://stackoverflow.com/questions/2662485/simple-php-regex-question
		getHref: function(embedRef) {
			return 'https://vimeo.com/' + embedRef.videoId;
		},
		renderImg: function(embedRef, callback) {
			return '<img src="'+embedRef.img+'" />';
		},
		require: function(embedRef, callback) {
			$.getJSON("https://vimeo.com/api/v2/video/" + embedRef.videoId + ".json?callback=?", function(data) {
				//console.log("vimeo api response", data);
				embedRef.img = data[0].thumbnail_medium;
				callback(embedRef);
			});
		},
		render: function(embedRef, options, callback) {
			var options = options || embedDefaults;
			var url = 'https://player.vimeo.com/video/' + embedRef.videoId + '?title=0&amp;byline=0&amp;portrait=0&amp;wmode=opaque&amp;autoplay=' + (options.autoplay ? 1 : 0);
			var html = '<iframe src="'+url+'" width="'+options.width+'" height="'+options.height+'" frameborder="0" type="text/html" ></iframe>';
			if (callback) callback(html)
			return html;
		}
	};
	
	var soundcloudEmbed = {
		whydPrefix: "sc",
		regex: /https?:\/\/(?:www\.)?soundcloud\.com\/([\w-_\/]+)/,
		getHref: function(embedRef) {
			return 'https://soundcloud.com/' + embedRef.videoId;
		},
		renderImg: function(embedRef, callback) {
			return '<img src="'+embedRef.img+'" />';
		},
		require: function(embedRef, callback) {
			var url = 'https://soundcloud.com/oembed?url='+encodeURIComponent(embedRef.url)+'&format=js&iframe=true&maxwidth='+embedDefaults.width + '&callback=?';
			$.getJSON(url, function(data, status) {
				embedRef.name = data.title;
				embedRef.html = data.html;
				var scUrl = embedRef.videoId = /url=([^&]*)&/.exec(data.html);
				if (scUrl && scUrl.length == 2) {
					embedRef.contentId = decodeURIComponent(scUrl[1]);
					var trackId = embedRef.contentId.split("/").pop();
					$.getJSON("https://api.soundcloud.com/tracks/" + trackId + ".json?client_id="+scClientId+"&callback=?", function(data) {
						if (data)
							embedRef.img = data.artwork_url;
						callback(embedRef);
					});
				}
				else
					callback(embedRef);
			});
		},
		render: function(embedRef, options, callback) {
			var html = embedRef.html;
			if (!html) {
				var options = options || embedDefaults;
				var hash = embedRef.id.indexOf("#")+1;
				var scId = hash ? embedRef.id.substr(hash) : embedRef.videoId;
				if (scId.indexOf("http") == -1)
					scId = "https://api.soundcloud.com/tracks/" + scId;
				var url = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(scId) + '&amp;show_artwork=true&amp;' + (options.autoplay ? 'auto_play=true' : '');
				html = '<iframe src="'+url+'" width="'+embedDefaults.width+'" height="166" scrolling="no" frameborder="0" kwframeid="4"></iframe>';
			}
			if (callback) callback(html);
			return html;
		}
	};
	
	var whydEmbed = {
		whydPrefix: "wy",
		regex: /http:\/\/(?:www\.)?(?:proto\.)?whyd\.com(\/(?:[mku]|user)?\/(?:[a-z0-9_\-]+)?)/,
		require: function(embedRef, callback) {
			$.post("/getResourceMetadata", {url:embedRef.url}, function(data){
				//console.log(data);
				if (data && data.mid) {
					//console.log("found whyd topic:", data.name);
					embedRef.id = data.mid;
					embedRef.img = data.img;
					embedRef.name = data.name;
				}
				callback(embedRef);
			});
		}/*,
		render: function(embedRef, options, callback) {
			var html = '<div class="favItem"><img src="'+embedRef.img+'" title="'+embedRef.name+'"/></div>'
				+  '<div class="favDel" onclick="removeFav(\'' + embedRef.id + '\')">&nbsp;</div>';
			if (callback) callback(html);
			return html;
		}*/
	};
	
	var embedTypes = {
		"yt": youtubeEmbed,
		"dm": dailymotionEmbed,
		"vi": vimeoEmbed,
		"sc": soundcloudEmbed,
		"wy": whydEmbed
	};

	var embedDetectors = []; //[youtubeEmbed, dailymotionEmbed, dailymotionEmbed2, vimeoEmbed, soundcloudEmbed, whydEmbed];
	for (var i in params.detectTypes)
		embedDetectors.push(embedTypes[params.detectTypes[i]])
	
	
	return {
		extractEmbedRef: function(url, callback) {
			var embedRef = {url:url};
			for (var i in embedDetectors) {
				//console.log("testing", i);
				if (embedDetectors[i].regex.test(url)) {
					//console.log("match!", i, url);
					//do {
						var u = embedDetectors[i].regex.exec(url);
						if (u && u.length > 0) {
							var videoId = u.pop();
							embedRef = {
								url: url,
								id: "/"+embedDetectors[i].whydPrefix+"/"+videoId,
								videoId: videoId,
								embedType: embedDetectors[i]
							};
							//console.log("embedRef", embedRef);
							if (embedDetectors[i].require) { // e.g. whyd topics need to be queried to the server before rendering
								var timeout = setTimeout(function() {
									callback({error:"unable to embed from this URL, request timed out"});
								}, 2000);
								embedDetectors[i].require(embedRef, function(embedRef) {
									clearTimeout(timeout);
									callback(embedRef);
								});
							}
							else
								callback(embedRef); // immediate rendering
							return embedRef; // return the current state of completion of embedRef anyway
						}
					//} while (u != null);
				}
			}
			
			// no embed type was detected => it might be an image
			getContentType(url, function(data) {
				//console.log("detected url mime type", data, url);
				if (!data || !data.contentType)
					callback(data);
				else if (data.contentType.indexOf("image/") == 0) {
					embedRef = {
						url: url,
						id: url,
						img: url,
					//	md5: hex_md5(url),
						mime: data.contentType,
						embedType: imageEmbed
					};
					callback(embedRef);
				}
				else if (data.contentType.indexOf("text/html") == 0) {
					embedRef = {
						url: url,
						id: url,
					//	md5: hex_md5(url),
						mime: data.contentType,
						embedType: pageEmbed,
						images: data.images,
						name: data.title
					};
					callback(embedRef);
				}
			});
			
			return embedRef;
		},
		findLinks: function (text, callback) {
			var found = false;
			do {
				var u = generalUrl.exec(text); // get next match
				if (u && u.length > 0) {
					callback(u[0]);
					found = true;
				}
			} while (u != null);
			return found;
		},
		renderEmbed: function (embedId, options) {
			if (options)
				for(var i in embedDefaults)
					options[i] = options[i] || embedDefaults[i];
			console.log("renderEmbed", embedId, options);
			var embedTypeId = embedId.split("/")[1]
			var videoId = embedId.substr(embedId.indexOf("/", 1) + 1);
			return embedTypes[embedTypeId].render({id:embedId, videoId:videoId}, options);
		}
	};
}

try {
	module.exports = ContentEmbed;
}
catch (e) {}
