$(window).ready(function() {
  
  var //user = null,
    current = null,
    vids = [],
    feedOffset = 0,
    playlist = $("#playlist"),
    youtubeRegex = /v=([a-zA-Z0-9_\-]+)/,
    youtubeUrl = /^http\:\/\/www\.youtube\.com\/watch/;

  var flashvars = {autoplay:1}, attributes = {};
  var params = {
    allowFullScreen: "true",
    allowscriptaccess: "always",
    autoplay: 1
    //wmode: "opaque"
  };

  FB.init({appId: "143116132424011", status: true, cookie: true, xfbml: true});
  
  var addVid = function (fbItem) {
    var vidUrl = fbItem.link;
    var vid = vidUrl.match(youtubeRegex);
    if (vid && vid.length===2) {
      vid = {i:vids.length, id:vid[1], name:fbItem.name, desc:fbItem.description,
        url:'http://www.youtube.com/v/' + vid[1] + '?enablejsapi=1&fs=1',
        from:fbItem.from, time:fbItem.updated_time, msg:fbItem.message };
      console.log("adding", vid.name, vid);
      vids.push(vid);
      $("<li>"+vid.name+"</li>").click(function() { playVid(vid) }).appendTo(playlist);
    }
  };
  
  var playVid = function (vid) {
    current = vid;
    console.log("playing", vid.name);
    $("#socialPane").html('<p>Shared by:</p><img src="http://graph.facebook.com/' + vid.from.id + '/picture"/>'
      + '<p>' + vid.from.name + (vid.msg ? ": " + vid.msg : "") + '</p>'
      + '<p class="timestamp">' +vid.time + '</p>')
    swfobject.embedSWF(vid.url, 'videoEmbed', '425', '344', '9.0.0', '', flashvars, params, attributes);
    
    window.playNext = function() {
      console.log("playNext");
      var next = vid.i+1 % vids.length;
      current = vids[next];
      playVid(current);
    };  
  };
  
  window.onytplayerStateChange = function (newState) {
    console.log("newState", newState);
    if (newState == 0) // end of video
      playNext();
  };

  window.onYouTubePlayerReady = function (playerId) {
    var embed = document.getElementById("videoEmbed");
    embed.addEventListener("onStateChange", "onytplayerStateChange");
  };
  
  var loadMore = function(until) {
    console.log("loadMore", feedOffset, until);
    
    var params = {/*offset:feedOffset, limit:feedOffset+100*/};
    if (until) params.until = until;
    
    FB.api('/me/home', params, function(feed) {
      console.log("feed", feed.data);
      for (var i in feed.data) {
        i = feed.data[i];
        console.log(i);
        if (i.type=="video" && i.link && i.link.match(youtubeUrl)) // TODO: support source: "http://www.youtube.com/v/XvifS2QOun4?version=3&feature=autoshare&autoplay=1"
          addVid(i);
      }
      if (!current && vids.length > 0)
        playVid(vids[0]);
        
      feedOffset += feed.data.length;
      if (vids.length < 10 && feed.data.length > 0 && feedOffset < 200)
        loadMore(feed.paging.next.substr(feed.paging.next.lastIndexOf("=")+1));
    });
  };
  
  var onFacebookSessionEvent = function(response) {
    if (response.session) {
      $("#welcome").hide();
      $("#container").show();
      loadMore();
    }
    else {
      console.log("The user has logged out, and the cookie has been cleared");
      $("#welcome").show();
      $("#container").hide();
      user = null;
    }
  };

  login = function() {
    FB.login(onFacebookSessionEvent, {perms:'read_stream'});
  };
    
  console.log("ready, waiting for login.");
});

