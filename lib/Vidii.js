//==================================================
// A wrapper for Youtube, Vimeo and Dailymotion
//==================================================
"use strict";

var _VidiiEvents = null;

// players:   An array of players to use
var Vidii = function(players)
{
    var self = this;

    // Create an event listener
    if (_VidiiEvents == null)
        _VidiiEvents = document.createElement("div");

    this.ActivePlayerType = "";
    this.ActivePlayer = null;
    this.IsCommanExternal = false; // Set when a external api command is fired

    this.SuportedPlayers =
    [
        "youtube",
        "dailymotion",
        "vimeo"
    ];

    this.RegisteredAPIS = [];
    this.ReadyCheckList = [];

    this.PlayStates = {};
    this.PlayStates.Unknow = 0;
    this.PlayStates.Playing = 1;
    this.PlayStates.Paused = 2;

    this.PlayStateLookUp =
    {
        0: "unknown",
        1: "playing",
        2: "paused"
    };

    if (players)
    {
        this.RegisterPlayers(players);
    }
};

// The urls to use for the various sites
// These can be overwritten to use your own
var VidiiAPIURLS = {
    youtube: "https://www.youtube.com/player_api",
    dailymotion: "http://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js",
    vimeo: "http://a.vimeocdn.com/js/froogaloop2.min.js"
};

// eg. youtube, vimeo, dailymotion
Vidii.prototype.SetPlayer = function(playerType)
{
    if (this.IsAPISupported(playerType))
    {
        this.ActivePlayerType = playerType;
        this.ActivePlayer = this.RegisteredAPIS[playerType];
    }
};

Vidii.prototype.IsAPISupported = function(APIid)
{
    var plrId = APIid.toLowerCase();

    if (this.SuportedPlayers.indexOf(plrId) != -1)
        return true;
    else
    {
        console.error("[Vidii]: Unsupported API "+plrId);
        return false;
    }
};

// Register APIS for use
// The players will be set to the same size as the div provided
// players = {{type:"youtube", divId="youtubeDiv"}, {type:"dailymotion", divId="dailyDiv"}};
Vidii.prototype.RegisterPlayers = function(players)
{
    for (var i = 0; i < players.length; i++)
    {
        var player = players[i];

        if (this.IsAPISupported(player.type))
        {
            this.RegisteredAPIS[player.type] = new this.APIS[player.type](player.divId, this);
        }
    }
};

Vidii.prototype.RegisterEvent = function(name, callback)
{
    _VidiiEvents.addEventListener(name, function(e) {callback(e.detail); });
};

// Events
/*
    onPlayerReady:
        type: youtube

    onPlayStateChangedInternal
        type: youtube
        state: 2

     onPlayStateChangedExternal
        type: youtube
        state: 2

    onAllPlayersReady

    onVideoLoaded

 */

//======================================
// Player Controls
//======================================
Vidii.prototype.Show = function(show)
{
    this.ActivePlayer.Show(show);
};

Vidii.prototype.Play = function()
{
    this.IsCommanExternal = true;
    this.ActivePlayer.Play();
};

Vidii.prototype.Pause = function()
{
    this.IsCommanExternal = true;
    this.ActivePlayer.Pause();
};

Vidii.prototype.CueVideoByID = function(vidID)
{
    this.IsCommanExternal = true;
    this.ActivePlayer.CueVideoByID(vidID);
};

Vidii.prototype.SeekTo = function(time)
{
    this.IsCommanExternal = true;
    this.ActivePlayer.SeekTo(time);
};

Vidii.prototype.GetPlayState = function()
{
    return this.ActivePlayer.GetPlayState();
};

Vidii.prototype.GetTime = function()
{
    return this.ActivePlayer.GetTime();
};

Vidii.prototype.Clear = function()
{
    this.ActivePlayer.Clear();
};

Vidii.prototype._VidiiPlayerLoaded = function(type)
{
    this.ReadyCheckList[type] = true;

    // Check if that is them all
    var allLoaded = true;
    for (var key in this.RegisteredAPIS)
    {
        if (this.ReadyCheckList[key] != true)
            allLoaded = false;
    }

    if (allLoaded)
        _VidiiEvents.dispatchEvent(new CustomEvent("onAllPlayersReady", {}));
};

//======================================
// API Bindings
//======================================
Vidii.prototype.APIS = {};

//--------------------------------------
// Youtube bindings
//--------------------------------------
Vidii.prototype.APIS["youtube"] = function(DivID, vidii)
{
    // Public fields
    this.Player = null;

    // private fields
    var self = this;
    var parentDiv = document.getElementById(DivID);
    var playerInnerDiv = document.createElement('div');
    parentDiv.appendChild(playerInnerDiv);
    playerInnerDiv.setAttribute("id", DivID+"_inner");

    var tag = document.createElement('script');
    tag.src = VidiiAPIURLS["youtube"];
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Listen for global Events
    _VidiiEvents.addEventListener("onYouTubePlayerAPIReady", _onYouTubePlayerAPIReady);
    _VidiiEvents.addEventListener("onYouTubeonPlayerStateChange", _onYouTubeonPlayerStateChange);

    // Private functions
    function _onYouTubePlayerAPIReady()
    {
        self.Player = new YT.Player(DivID+"_inner",
            {
                height: ""+parentDiv.offsetHeight,
                width: ""+parentDiv.offsetWidth,
                //videoId: 'M7lc1UVf-VE',
                playerVars: {
                    wmode: "opaque"
                },
                events:
                {
                    'onReady': onYouTubeonPlayerReady,
                    'onStateChange': onYouTubeonPlayerStateChange
                }
            });

        playerInnerDiv = document.getElementById(DivID+"_inner");

        self.Player.addEventListener("onStateChange", "onYouTubeonPlayerStateChange");

        _VidiiEvents.dispatchEvent(new CustomEvent("onPlayerReady", {'detail': {type:"youtube"}}));
        vidii._VidiiPlayerLoaded("youtube");
    }

    var lastPlayState = 0;
    var vidLoaded = false;
    function _onYouTubeonPlayerStateChange(e)
    {
        if (!vidii.IsCommanExternal && lastPlayState != self.GetPlayState()) // From the players controls
        {
            lastPlayState = self.GetPlayState();

            _VidiiEvents.dispatchEvent(new CustomEvent("onPlayStateChangedInternal", {'detail':
            {
                type: "youtube",
                state: self.GetPlayState(),
                time: self.GetTime()
            }}));
        }
        else if (vidii.IsCommanExternal && lastPlayState != self.GetPlayState()) // From a Vidii API call
        {
            lastPlayState = self.GetPlayState();
            vidii.IsCommanExternal = false;

            _VidiiEvents.dispatchEvent(new CustomEvent("onPlayStateChangedExternal", {'detail':
            {
                type: "youtube",
                state: self.GetPlayState(),
                time: self.GetTime()
            }}));
        }

        if (self.Player.getPlayerState() == 5 && !vidLoaded && self.GetTime() == 0)
        {
            _VidiiEvents.dispatchEvent(new CustomEvent("onVideoLoaded", {'detail': {type:"youtube"}}));
            vidLoaded = true;
        }
        else if (self.Player.getPlayerState() != 5)
            vidLoaded = false;
    }

    // Public Functions
    this.Show = function(show) // Set the player to be visable or hidden
    {
        if (show)
        {
            playerInnerDiv.style.visibility = "visible";
            parentDiv.style.visibility = "visible";
            playerInnerDiv.style.height = parentDiv.style.height;
        }
        else
        {
            playerInnerDiv.style.visibility = "hidden";
            parentDiv.style.visibility = "hidden";
            playerInnerDiv.style.height = "0px";
        }
    };

    this.Play = function()
    {
        this.Player.playVideo();
    };

    this.Pause = function()
    {
        this.Player.pauseVideo();
    };

    this.CueVideoByID = function(id)
    {
        this.Player.cueVideoById(id);
    };

    this.SeekTo = function(time)
    {
        this.Player.seekTo(time);
    };

    this.GetTime = function()
    {
        return this.Player.getCurrentTime();
    };

    this.GetPlayState = function()
    {
        if (this.Player.getPlayerState() == 1) // Playing
            return 1;
        else if (this.Player.getPlayerState() == 2) // Paused
            return 2;
        else                                        // unknown
            return 0;
    };

    this.Clear = function()
    {
        // Cue a dud video
        this.Player.cueVideoById("nope");
    };
};

// Register global events
function onYouTubePlayerAPIReady()
{
    _VidiiEvents.dispatchEvent(new CustomEvent("onYouTubePlayerAPIReady", {}));
}

function onYouTubeonPlayerReady(event)
{

};

function onYouTubeonPlayerStateChange(event)
{
    _VidiiEvents.dispatchEvent(new CustomEvent("onYouTubeonPlayerStateChange"), {"detail": {data: event}});
};

//--------------------------------------
// Dailymotion bindings
//--------------------------------------
Vidii.prototype.APIS["dailymotion"] = function(DivID, vidii)
{
    // Public fields
    this.Player = null;

    // Load the embedSWF lib
    var tag = document.createElement('script');
    tag.src = VidiiAPIURLS["dailymotion"];
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    tag.onload = Init;

    // private fields
    var self = this;
    var parentDiv = document.getElementById(DivID);
    var playerInnerDiv = parentDiv.appendChild(document.createElement("div"));
    playerInnerDiv.setAttribute("id", DivID+"Inner");
    self.Player = document.getElementById(DivID+"Inner");

    // Listen for global Events
    _VidiiEvents.addEventListener("onDailymotionPlayerReady", _onDailymotionPlayerReady);
    _VidiiEvents.addEventListener("onDailymotionPlayerStateChanged", _onDailymotionPlayerStateChanged);

    function Init()
    {
        var params = { allowScriptAccess: "always", allowTimePreview: 1, allowfullscreen: "true"};
        var atts = { id: DivID+"Inner" };
        swfobject.embedSWF("http://www.dailymotion.com/swf?enableApi=1&playerapiid="+atts.id,
            atts.id, parentDiv.offsetWidth, parentDiv.offsetHeight, "9", null, null, params, atts);
    }

    // Private functions
    function _onDailymotionPlayerReady(id)
    {
        self.Player = document.getElementById(DivID+"Inner");
        self.Player.addEventListener("onStateChange", "onDailymotionPlayerStateChanged");

        _VidiiEvents.dispatchEvent(new CustomEvent("onPlayerReady", {'detail': {type:"dailymotion"}}));
        vidii._VidiiPlayerLoaded("dailymotion");
    }

    //var lastPlayState = 0;
    this.vidClearing = false;
    function _onDailymotionPlayerStateChanged(id)
    {
        if (!vidii.IsCommanExternal) // From the players controls
        {
            _VidiiEvents.dispatchEvent(new CustomEvent("onPlayStateChangedInternal", {'detail':
            {
                type: "dailymotion",
                state: self.GetPlayState(),
                time: self.GetTime()
            }}));
        }
        else if (vidii.IsCommanExternal) // From a Vidii API call
        {

            vidii.IsCommanExternal = false;

            _VidiiEvents.dispatchEvent(new CustomEvent("onPlayStateChangedExternal", {'detail':
            {
                type: "dailymotion",
                state: self.GetPlayState(),
                time: self.GetTime()
            }}));
        }

        //if (self.vidClearing)
           // self.vidClearing = false;
         if (self.GetPlayState() == 0 && self.GetTime() == 0)
        {
            _VidiiEvents.dispatchEvent(new CustomEvent("onVideoLoaded", {'detail': {type:"dailymotion"}}))
        }

           // self.vidClearing = !self.vidClearing;
    }

    // Public Functions
    this.Show = function(show) // Set the player to be visable or hidden
    {
        if (show)
            self.Player.style.visibility  = "visible";
        else
            self.Player.style.visibility  = "hidden";

        parentDiv.style.visibility = self.Player.style.visibility;
    };

    this.Play = function()
    {
        this.Player.playVideo();
    };

    this.Pause = function()
    {
        this.Player.pauseVideo();
    };

    this.CueVideoByID = function(id)
    {
        this.Player.loadVideo(id, "full", {});
    };

    this.SeekTo = function(time)
    {
        this.Player.seekTo(time);
    };

    this.GetTime = function()
    {
        return this.Player.getCurrentTime();
    };

    this.GetPlayState = function()
    {
        if (this.Player.getPlayerState() == 1) // Playing
            return 1;
        else if (this.Player.getPlayerState() == 2) // Paused
            return 2;
        else                                        // unknown
            return 0;
    };

    this.Clear = function()
    {
        // Cue a dud video
        this.vidClearing = true;
        this.Player.cueVideoById("nope");
    };
};

function onDailymotionPlayerReady(id)
{
    _VidiiEvents.dispatchEvent(new CustomEvent("onDailymotionPlayerReady"));
};

function onDailymotionPlayerStateChanged(id)
{
    _VidiiEvents.dispatchEvent(new CustomEvent("onDailymotionPlayerStateChanged"));
};

//--------------------------------------
// Vimeo bindings
//--------------------------------------
Vidii.prototype.APIS["vimeo"] = function(DivID, vidii)
{
    // Public fields
    this.Player = null;

    // private fields
    var self = this;
    var parentDiv = document.getElementById(DivID);
    var InnerDiv = null;
    var CurrentTime = 0;
    var CurrentPlayState = 0;
    var FirstLoad = true;

    // Load the froogaloop API
    var tag = document.createElement('script');
    tag.src = VidiiAPIURLS["vimeo"];
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    tag.onload = OnFroogaloopLoad;

    function OnFroogaloopLoad()
    {
        EmbeddPlayer("86019637");
        self.Player = $f(document.getElementById(DivID+"Inner"));

        self.Player.addEvent('ready', function()
        {
            if (FirstLoad)
            {
                _VidiiEvents.dispatchEvent(new CustomEvent("onPlayerReady", {'detail': {type:"vimeo"}}));
                vidii._VidiiPlayerLoaded("vimeo");

                FirstLoad = false;
                self.CueVideoByID("");
            }
            else
                _VidiiEvents.dispatchEvent(new CustomEvent("onVideoLoaded", {'detail': {type:"vimeo"}}));

            self.Player.addEvent('play', function()
            {
                CurrentPlayState = vidii.PlayStates.Playing;
                onStateChanged();
            });

            self.Player.addEvent('pause', function()
            {
                CurrentPlayState = vidii.PlayStates.Paused;
                onStateChanged();
            });

            self.Player.addEvent('seek', function()
            {
                onStateChanged();
            });

            self.Player.addEvent('playProgress', function(value, id)
            {
                CurrentTime = value.seconds;
            });
        });
    }

    function EmbeddPlayer(vidID)
    {
        if (vidID != "")
            vidID = "/"+vidID;
        else
            vidID = "/1";

        var id = DivID+"Inner";
        var srcUrl = "http://player.vimeo.com/video"+vidID+"?api=1&player_id="+id;
        parentDiv.innerHTML = '<iframe id="'+id+'" src="'+srcUrl+'" width="'+parentDiv.offsetWidth+'" height="'+parentDiv.offsetHeight+'" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>'
        InnerDiv = document.getElementById(DivID+"Inner")
    }

    function onStateChanged()
    {
        if (!vidii.IsCommanExternal) // From the players controls
        {
            _VidiiEvents.dispatchEvent(new CustomEvent("onPlayStateChangedInternal", {'detail':
            {
                type: "vimeo",
                state: self.GetPlayState(),
                time: self.GetTime()
            }}));
        }
        else if (vidii.IsCommanExternal) // From a Vidii API call
        {
            vidii.IsCommanExternal = false;
            _VidiiEvents.dispatchEvent(new CustomEvent("onPlayStateChangedExternal", {'detail':
            {
                type: "vimeo",
                state: self.GetPlayState(),
                time: self.GetTime()
            }}));
        }
    }

    // Public Functions
    this.Show = function(show) // Set the player to be visable or hidden
    {
        if (show)
            parentDiv.style.visibility  = "visible";
        else
            parentDiv.style.visibility  = "hidden";
    };

    this.Play = function()
    {
        this.Player.api("play");
    };

    this.Pause = function()
    {
        this.Player.api("pause");
    };

    this.CueVideoByID = function(vidID)
    {
        if (vidID)
            vidID = "/"+vidID;

        var id = DivID+"Inner";
        document.getElementById(DivID+"Inner").src = "http://player.vimeo.com/video"+vidID+"?api=1&player_id="+id;
    };

    this.SeekTo = function(time)
    {
        this.Player.api("seekTo", time);
    };

    this.GetTime = function()
    {
        return CurrentTime;
    };

    this.GetPlayState = function()
    {
        return CurrentPlayState;
    };

    this.Clear = function()
    {
        // Cue a dud video
        this.CueVideoByID("");
    };
};

function onDailymotionPlayerReady(id)
{
    _VidiiEvents.dispatchEvent(new CustomEvent("onDailymotionPlayerReady"));
};