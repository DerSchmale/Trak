/**
 *
 * @param bpm The amount of beats per minute of the song
 * @constructor
 */
TRAK.TrakEngine = function(bpm)
{
    this._playheadTime = 0;
    this._bpm = bpm;
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
     * @param {number} time16th The 16th note in the song to which to attach the marker.
     * @param {string} name The name of the marker, for easy reference
     */
    addSyncMarker: function(note16th, name)
    {
        this._isInitialized = false;
        syncMarkers.push( { time16th: time16th, name: name } );
    },

    /**
     * Adds a behavior to the Trak engine
     * @param behaviour The behavior to be added.
     * @param {number} startTime The 16th note at which to start the effect. This includes the fade-in time.
     * @param {number} endTime The 16th note at which to stop the effect. This includes the fade-out time.
     * @param {number} fadeIn16th The duration in 16th notes for the fade-in effect.
     * @param {number} fadeOut16th The duration in 16th notes for the fade-out effect.
     * @param {number} layer (optional) The layer of the behavior. Concurrent behaviours with lower layer values will be executed first.
     */
    addBehavior: function(behaviour, start16th, end16th, fadeIn16th, fadeOut16th, layer)
    {
        var msPer16th = 15000/this._bpm;
        var startTime = start16th * msPer16th;
        var endTime = end16th * msPer16th;
        if (layer === undefined) layer = 0;
        this._behaviors.push(new TRAK.BehaviorInstance(behaviour, layer, startTime, endTime, msPer16th, msPer16th));

        this._isInitialized = false;
    },

    _initialize: function()
    {
        this._isInitialized = true;
        this._syncMarkers.sort( function(a, b) { return a.time16th - b.time16th; } );
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