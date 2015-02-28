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
    constructor: TRAK.Behavior,

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

