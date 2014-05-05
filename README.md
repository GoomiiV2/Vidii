Vidii
=====

A web Video API normalizer.

<a href="http://goomichan.github.io/Vidii/Index.html">Demo here.</a>

Vidii wraps around YouTubes, DailyMotion and Vimeo player api's and hides their api behind Vidii this is to make it easyier to embed and control multiple videos.

This was made to suit my needs on www.nyaasync.net so it may not cover all your needs, still i figured it was worth sharing :>

Usage
=====

The demo should be a good example of how to use it.

But here is how easy it is to embed all the players.

```HTML
<div id="vimeoDiv" style="width:720px; height:480px;"></div>

<div id="dailymotionDiv" style="width:720px; height:480px;"></div>

<div id="youtubeDiv" style="width:720px; height:480px;"></div>
```

```JavaScript
var Video = new Vidii([
      {type:"youtube", divId:"youtubeDiv"},
      {type:"dailymotion", divId:"dailymotionDiv"},
      {type:"vimeo", divId:"vimeoDiv"}
  ]);
  
// Set a player and paly a video
Video.SetPlayer("youtube");
Video.CueVideoByID("soemvideoid");
Video.Play();
```

And thats it, you would have three palyers on your page with the youtube one playing your video :>
