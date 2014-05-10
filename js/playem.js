console.log("playem.js")

var ytPlayer = new YoutubePlayer('videoEmbed');
var tracklist = new Tracklist(ytPlayer);
var fbImporter = new FacebookImporter();

var playlist = $("#playlist");
var chkGroups = false;

fbImporter.onNewVid = function(fbItem) {
	var vid = tracklist.addTrack(fbItem);
	if (vid) {
		vid.li = $("<li>"+vid.name+"</li>").click(function() {
			tracklist.play(vid.i);
		}).appendTo(playlist);
		if (!tracklist.current)
			tracklist.play();
	}
};

tracklist.onTrackPlaying = function(vid) {
	$("li").css('color', 'gray');
	$("#playCursor").remove();
	//window.current = current = vid;
	vid.li.css('color', 'white').prepend("<span id='playCursor'>► </span>");
	$("#socialPane").html('<p>Shared by:</p><img src="http://graph.facebook.com/' + vid.from.id + '/picture"/>'
		+ '<p>' + vid.from.name + (vid.msg ? ": " + vid.msg : "") + '</p>'
		+ '<p class="timestamp"><a href="'+vid.fbUrl+'" title="comment on facebook">' +vid.time + '</a></p>'
		+ '<span class="postShareFB" onclick="shareVideo()">&nbsp;</span>')
	$("#btnNext").show().unbind().click(function(){
		tracklist.next();
	});
};

window.shareVideo = function() {
	var vid = tracklist.current;
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

function initGroups() {
	var $selGroup = $("#selGroup").show();
	$selGroup.append(new Option("(personal newsfeed)", "/me/home", true, true));
	$selGroup.change(function(){
		var groupId = $selGroup.val();
		console.log("switching to group: ", groupId);
		fbImporter.switchToGroup(groupId, function(){
			playlist.html("");
			tracklist.clear();
		});
	});
	fbImporter.loadGroups(function(g){
		$selGroup.append(new Option(g.name, "/" + g.id + "/feed" /*, true, true*/));
	});
}

// called when the user clicks the facebook connect button

var onFacebookSessionEvent = function(response) {
	console.log("facebook response", response);
	if (response.session || response.authResponse) {
		$("#welcome").hide();
		$("#container").show();
		if (chkGroups)
			initGroups();
		fbImporter.loadMore();
	}
	else {
		$("#welcome").show();
		$("#container").hide();
		user = null;
	}
};

window.login = function(nextPage) {
	var handler = nextPage ? function(){
		window.location.href = nextPage;
	} : onFacebookSessionEvent;
	console.log("FB.login...");
	chkGroups = document.getElementById("chkGroups").checked;
	FB.login(handler, {
		scope: 'read_stream' + chkGroups ? ',user_groups' : ''  // manage_pages
	});
};

// called when a video link is attached to the URL (e.g. from facebook shared link)
function openVideoOverlay(videoUrl) {
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
	openVideoOverlay('http://www.youtube.com/v/' + window.location.href.substr(ytLink+3));
else if (window.startOnLoad)
	fbImporter.loadMore();
