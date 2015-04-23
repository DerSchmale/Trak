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