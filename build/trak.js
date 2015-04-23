// TODO: Should we remove the bpm and 16th stuff, so it's not only useful when using music?
//          -> Maybe provide a calculator MusicSync() functionality that translates 16th (or measures etc) to ms?

var TRAK = { VERSION: '0.1' };

TRAK.Behavior = function()
{
    this._strength = 0.0;
}

/**
 * Behavior is class for track elements which can be a simple command, a scripted movement, an effect, etc.
 * For instance, behaviours can simply spawn objects into a 3D scene, or add/remove post-processing effects but also
 * update their properties, and so on.
 *
 * Behaviors can be extended, or simply have their override methods assigned with an implementation.
 *
 * Use the strength property to determine how "strong" the behaviour should be. This could be using strength as alpha
 * (for fade-ins), or for example the amount or raindrops to show (to smoothly fade-in/out weather effects)
 *
 * @author David Lenaerts
 */
TRAK.Behavior.prototype = {
// override these when necessary:

    /**
     * Called when Trak's playhead moves. Can be overridden to provide per-frame animations.
     *
     * @param dt The time difference since last frame. Use the time property whenever possible for numerical stability.
     * @param time The time relative to the behavior's start time (preferred use)
     */
    update: function(dt, time) {},

    /**
     * Override to provide functionality to react when Trak reaches a marker at the current playhead position.
     * @param name The name of the marker.
     */
    onMarker: function(name) {},

    /**
     * Called when the behavior is initialized. Override to initialize the effect.
     */
    onRegister: function() {},

    /**
     * Called when the behavior is removed. Override to destroy the effect. Generally, if onRegister is implemented,
     * onRemove should be as well, to clean up its effects.
     */
    onRemove: function() {},


    /**
     * @private
     */
    getStrength: function() { return this._strength; },

    /**
     * @private
     */
    setStrength: function(value) { this._strength = value; }
}


/**
 * @param behavior The behavior used by this instance.
 * @param layer The layer level of this instance. Lower values will be executed first.
 * @param startTime The time at which the instance should start updating. This includes fade-in time.
 * @param endTime The time at which the instance should stop updating. This includes fade-out time.
 * @param fadeInTime The time the instance takes to come to "full strength"
 * @param fadeOutTime
 * @constructor
 */
TRAK.BehaviorInstance = function(behavior, layer, startTime, endTime, fadeInTime, fadeOutTime)
{
    // this is used internally to chain sorted instances
    this._next = null;

    this.behavior = behavior;
    this.priority = layer;
    this.startTime = startTime;
    this.endTime = endTime;
    this.fadeInTime = fadeInTime;
    this.fadeOutTime = fadeOutTime;
    this.isRunning = false;
}

TRAK.BehaviorInstance.prototype = {
    /**
     * Called by Trak.
     * @param dt The time difference since last frame.
     * @param time The current position of the playhead.
     */
    update: function(dt, time)
    {
        var relativeTime = time - this.startTime;

        // first time update deserves something extra :)
        if (!this.isRunning) {
            this.behavior.onRegister();
            this.isRunning = true;
        }

        if (this.fadeInTime > 0 && relativeTime < this.fadeInTime)
            this.behavior.strength = relativeTime / this.fadeInTime;
        else {
            this.timeDiff = this.endTime - this.time;

            if (this.fadeOutTime > 0 && this.timeDiff < this.fadeOutTime)
                this.behavior.strength = relativeTime / this.fadeOutTime;
            else
                this.behavior.strength = 1;
        }

        this.behavior.update(dt, time);
    },

    /**
     * Destroys this instance of the effect.
     */
    destroy: function()
    {
        this.behavior.onRemove();
    }
}
/**
 * Converts note types or measures to milliseconds. Time signature or tempo changes not supported.
 * @param bpm The amount of beats per minute of the song
 * @constructor
 */
TRAK.BPMToMS = function(bpm, numerator, denominator)
{
    this._numerator = numerator || 4;
    this._denominator = denominator || 4;
    this._bpm = bpm;
    this._msPer16th = 15000/bpm;
};

TRAK.BPMToMS.prototype =
{
    fromBar: function(measure)
    {
        return this.from16th(measure * 16.0 / this._denominator * this._numerator)
    },

    fromWhole: function(value)
    {
        return this.from16th(value * 16.0);
    },

    fromHalf: function(value)
    {
        return this.from16th(value * 8.0);
    },

    from4th: function(value)
    {
        return this.from16th(value * 4.0);
    },

    from8th: function(value)
    {
        return this.from16th(value * 2.0);
    },

    from16th: function(value)
    {
        return value * this._msPer16th;
    }
};
TRAK.CompoundBehavior = function(behaviors)
{
    TRAK.Behavior.call(this);
    this._behaviors = behaviors;
}

TRAK.CompoundBehavior.prototype = Object.create(TRAK.Behavior.prototype);

TRAK.CompoundBehavior.prototype.update = function(dt, time)
{
    for (var i = 0; i < this._behaviors.length; ++i)
        this._behaviors[i].update(dt, time);
};

TRAK.CompoundBehavior.prototype.onMarker = function(name)
{
    for (var i = 0; i < this._behaviors.length; ++i)
        this._behaviors[i].onMarker(name);
};

TRAK.CompoundBehavior.prototype.onRegister = function()
{
    for (var i = 0; i < this._behaviors.length; ++i)
        this._behaviors[i].onRegister();
};

TRAK.CompoundBehavior.prototype.onRemove = function()
{
    for (var i = 0; i < this._behaviors.length; ++i)
        this._behaviors[i].onRemove();
};

/**
 * @private
 */
TRAK.CompoundBehavior.setStrength = function(value)
{
    this._strength = value;

    for (var i = 0; i < this._behaviors.length; ++i)
        this._behaviors[i].setStrength(value);
}
/**
 *
 * @param numFrames The amount of frames to average
 * @constructor
 */
TRAK.FPSCounter = function(numFrames)
{
    this._numFrames = numFrames || 1;
    this._frames = [];
    this._maxFPS = undefined;
    this._minFPS = undefined;
    this._currentFPS = 0;
    this._averageFPS = 0;
    this._runningSum = 0;

    for (var i = 0; i < this._numFrames; ++i)
        this._frames[i] = 0;

    this._index = 0;
};

TRAK.FPSCounter.prototype =
{
    /**
     * Updates the counter with a new frame time
     * @param dt The time in milliseconds for the last frame
     */
    update: function(dt)
    {
        this._currentFPS = 1000 / dt;

        this._runningSum -= this._frames[this._index];
        this._runningSum += this._currentFPS;
        this._averageFPS = this._runningSum / this._numFrames;
        this._frames[this._index++] = this._currentFPS;

        if (this._index == this._numFrames) this._index = 0;

        if (this._maxFPS === undefined || this._currentFPS > this._maxFPS)
            this._maxFPS = this._currentFPS;

        if (this._minFPS === undefined || this._currentFPS < this._minFPS)
            this._minFPS = this._currentFPS;


    },

    getLastFrameFPS: function()
    {
        return Math.round(this._currentFPS);
    },

    getAverageFPS: function()
    {
        return Math.round(this._averageFPS);
    },

    getMaxFPS: function()
    {
        return Math.round(this._maxFPS);
    },

    getMinFPS: function()
    {
        return Math.round(this._minFPS);
    },

    reset: function()
    {
        this._maxFPS = undefined;
        this._minFPS = undefined;
    }

};

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if(!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    if(!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());


/**
 * Encapsulates behaviour to handle frames and time differences.
 * @constructor
 */

TRAK.FrameTicker = function()
{
    this._isRunning = false;
    this._callback = undefined;
    this._dt = 0;
    this._playheadTime = 0;
}

TRAK.FrameTicker.prototype = {
    constructor: TRAK.FrameTicker,

    /**
     * Starts automatically calling a callback function every animation frame.
     * @param callback Function to call when a frame needs to be processed.
     */
    start: function(callback) {
        this._callback = callback;
        this._playheadTime = this._getTime();
        this._isRunning = true;
        this._tick();
        this._tick._this = this;
    },

    /**
     * Stops calling the function.
     */
    stop: function() {
        this._isRunning = false;
    },

    /**
     * @returns {number} The time passed in between two frames
     */
    get dt() { return this._dt; },

    /**
     * @private
     */
    _tick: function() {
        if (!this._isRunning) return;

        self.requestAnimationFrame(this._tick.bind(this));

        var currentTime = this._getTime();
        this._dt = currentTime - this._playheadTime;
        this._playheadTime = currentTime;

        this._callback();
    },

    /**
     * @private
     */
    _getTime: function() {
        if (self.performance === undefined || self.performance.now == undefined)
            return Date.now();
        else
            return self.performance.now();
    }
}
/**
 * @constructor
 */
TRAK.TrakEngine = function()
{
    this._playheadTime = 0;
    this._markerIndex = 0;
    this._behaviors = [];  // of type Behaviour
    this._syncMarkers = []; // of type SyncMarker
    this._isInitialized = false;
    this._runningBehaviorHead = null;
}

TRAK.TrakEngine.prototype = {
    constructor: TRAK.TrakEngine,

    /**
     * Updates the Trak engine, moving the playhead to the current time. Needs to be called before rendering the frame.
     *
     * @param {number} dt The time in milliseconds since the last update. 0 for first frame.
     */
    update: function(dt) {
        if (!this._isInitialized) this._initialize();

        this._playheadTime += dt;

        if (this._runningBehaviorHead == null) return;

        var prevInstance = null;
        var instance = this._runningBehaviorHead;

        // _markerIndex contains the starting index for the markers that haven't been called yet
        var markerLoop = this._markerIndex;

        do {
            // test if this behavior is expired
            if (instance.endTime <= this._playheadTime) {
                // if so, remove it from the list of currently playing instances
                if (prevInstance)
                    prevInstance._next = instance._next;
                else
                    this._runningBehaviorHead = instance._next;

                instance.destroy();
            }
            else if (instance.startTime <= this._playheadTime) {
                // reset marker loop to trigger updates that are in the past but weren't called before this update
                markerLoop = this._markerIndex;
                while ( markerLoop < this._syncMarkers.length && this._syncMarkers[markerLoop].time <= this._playheadTime)
                    instance.behavior.onMarker(this._syncMarkers[markerLoop++].name);

                instance.update(dt, this._playheadTime);
            }
            instance = instance._next;
        }
        while (instance != null);

        // markerLoop will contain the index for the next frame due to previous loop, so assign it
        this._markerIndex = markerLoop;
    },

    /**
     * Resets the timer to a given position. Scrubbing is at this point not very efficient.
     * @param {number} timeMS The time from which to start the demo
     */
    scrub: function(timeMS)
    {
        this._playheadTime = timeMS;
        this._isInitialized = false;
    },

    /**
     * Adds a sync marker.
     * @param {number} time The time in milliseconds from the start to which to attach the marker.
     * @param {string} name The name of the marker, for easy reference
     */
    addSyncMarker: function(time, name)
    {
        this._isInitialized = false;
        this._syncMarkers.push( { time: time, name: name } );
    },

    /**
     * Adds a behavior to the Trak engine
     * @param behaviour The behavior to be added.
     * @param {number} startTime The millisecond at which to start the effect. This includes the fade-in time.
     * @param {number} endTime The millisecond at which to stop the effect. This includes the fade-out time.
     * @param {number} fadeInTime (optional) The duration in milliseconds for the fade-in effect.
     * @param {number} fadeOutTime (optional) The duration in milliseconds for the fade-out effect.
     * @param {number} layer (optional) The layer of the behavior. Concurrent behaviours with lower layer values will be executed first.
     */
    addBehavior: function(behaviour, startTime, endTime, fadeInTime, fadeOutTime, layer)
    {
        if (fadeOutTime === undefined) fadeOutTime = 0;
        if (fadeInTime === undefined) fadeInTime = 0;
        if (layer === undefined) layer = 0;
        this._behaviors.push(new TRAK.BehaviorInstance(behaviour, layer, startTime, endTime, fadeInTime, fadeOutTime));

        this._isInitialized = false;
    },

    _initialize: function()
    {
        this._isInitialized = true;
        this._syncMarkers.sort( function(a, b) { return a.time - b.time; } );
        this._behaviors.sort( function(a, b) { return a.priority - b.priority; } );    // sort on priority
        this._markerIndex = 0;
        this._runningBehaviorHead = null;

        // copy to list so it's easier to remove things (need to copy anyway, since we need the original behavior list intact)
        for (var i = this._behaviors.length - 1; i >= 0; --i) {
            var behavior = this._behaviors[i];

            // if we scrubbed, don't include behaviors that should be already finished
            if (behavior.endTime > this._playheadTime) {
                behavior._next = this._runningBehaviorHead;
                this._runningBehaviorHead = behavior;
            }
        }
    }
}