/**
 * tests for playemjs
 * @author adrienjoly
 **/

(function runTests(listUrl, container, videoPlayer){

	var playem, playemWrapper, queue, timer, totalTracks = 0, recognized = 0, prevLength = 0;

	function whenDone(){
		clearTimeout(timer);
		console.info("all tracks passed! :-)")
		playem.stop();
	}

	function whenTimeout(){
		console.warn("TIMEOUT => test failed. :-(");
		playem.stop();
	}

	function onTrackChange(track){
		console.log("trying to play", track.index, "...");
		timer = setTimeout(whenTimeout, 8000);
	}

	function onTrackPlaying(track){
		console.log("ok");
		clearTimeout(timer);
		setTimeout(function(){
			if (!--totalTracks)
				whenDone();
			else
				playem.next();
		}, 2000);
	}

	function getLastAdded(){
		return queue[queue.length-1];
	}

	function addTrackByUrl(url){
		if (!url)
			return;
		playemWrapper.addTrack({ link: url });
		if (getLastAdded().trackId)
			recognized++;
		else
			console.warn("unable to recognize track url:", url);
	}

	loadSoundManager(function(){
		initPlayem(document.getElementById(container), videoPlayer, function(playemInstance){

			playem = playemInstance;
			playem.setPref("loop", false);
			playemWrapper = new PlayemWrapper(playem);
			playem.on("onTrackChange", onTrackChange);
			playemWrapper.onTrackPlaying = onTrackPlaying;

			queue = playem.getQueue();

			// load urls, and test them
			$.get(listUrl, function(txt){
				txt.split("\n").map(addTrackByUrl);
				totalTracks = queue.length;
				console.log("read", totalTracks, "tracks from", listUrl);
				console.log("=>", recognized, "tracks were recognized");
				if (totalTracks - recognized)
					return;
				console.log("ready to play", totalTracks, "tracks");
				playem.play(0);
			});

		});
	});
})("urls.txt", "container", "videoPlayer")
