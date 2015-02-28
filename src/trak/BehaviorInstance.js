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
    constructor: TRAK.BehaviorInstance,

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