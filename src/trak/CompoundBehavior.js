TRAK.CompoundBehavior = function(behaviors)
{
    TRAK.Behavior.call(this);
    this._behaviors = behaviors;
}

TRAK.CompoundBehavior.prototype = Object.create(TRAK.Behavior.prototype);

TRAK.CompoundBehavior.prototype.update = function(dt, time, strength)
{
    for (var i = 0; i < this._behaviors.length; ++i)
        this._behaviors[i].update(dt, time, strength);
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