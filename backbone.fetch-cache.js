/*!
  backbone.fetch-cache v0.1.0
  by Andy Appleton - https://github.com/mrappleton/backbone-fetch-cache.git
 */

// Backbone.Model
(function(undef) {
  var superFetch = Backbone.Model.prototype.fetch,
      supportLocalStorage = typeof window.localStorage !== 'undefined';

  Backbone.Model.attributeCache = {};
  if (typeof Backbone.Model.localStorageCache === 'undefined') {
    Backbone.Model.localStorageCache = true;
  }

  Backbone.Model.setCache = function(instance, opts) {
    opts = (opts || {});
    var url = _.isFunction(instance.url) ? instance.url() : instance.url,
        expires = false;
    // need url to use as cache key so return if we can't get it
    if (!url) { return; }

    if (opts.expires !== false) {
      expires = (new Date()).getTime() + ((opts.expires || 5 * 60) * 1000);
    }

    this.attributeCache[url] = {
      expires: expires,
      value: instance.toJSON()
    };
    this.setLocalStorage();
  };

  Backbone.Model.setLocalStorage = function() {
    if (!supportLocalStorage || !Backbone.Model.localStorageCache) { return; }
    localStorage.setItem('modelCache', JSON.stringify(Backbone.Model.attributeCache));
  };

  Backbone.Model.getLocalStorage = function() {
    if (!supportLocalStorage || !Backbone.Model.localStorageCache) { return; }
    Backbone.Model.attributeCache = JSON.parse(localStorage.getItem('modelCache')) || {};
  };

  // Return cached model attributes if opts.cache == true and the data has
  // already been fetched.
  Backbone.Model.prototype.fetch = function(opts) {
    opts = (opts || {});
    var url = _.isFunction(this.url) ? this.url() : this.url,
        data = Backbone.Model.attributeCache[url],
        expired = false, attributes = false;

    if (data) {
      expired = data.expires;
      expired = expired && data.expires < (new Date()).getTime();
      attributes = data.value;
    }

    if (!expired && opts.cache && attributes) {
      this.set(attributes, opts);
      if (_.isFunction(opts.success)) { opts.success(this); }
      // Mimic actual fetch behaviour buy returning a fulfulled promise
      return ( new $.Deferred() ).resolve(this);
    }

    // Delegate to the actual fetch method and store the attibutes in the cache
    return superFetch.apply(this, arguments).done(
      _.bind(Backbone.Model.setCache, Backbone.Model, this, opts)
    );
  };

  // Prime the cache from localStorage on initialization
  Backbone.Model.getLocalStorage();
})();

// Backbone.Collection
(function() {
  var superFetch = Backbone.Collection.prototype.fetch,
        supportLocalStorage = typeof window.localStorage !== 'undefined';

  Backbone.Collection.attributeCache = {};
  if (typeof Backbone.Collection.localStorageCache === 'undefined') {
    Backbone.Collection.localStorageCache = true;
  }

  // Class methods
  Backbone.Collection.setCache = function(instance, opts) {
    opts = (opts || {});
    var url = _.isFunction(instance.url) ? instance.url() : instance.url,
        expires = false;
    // need url to use as cache key so return if we can't get it
    if (!url) { return; }

    if (opts.expires !== false) {
      expires = (new Date()).getTime() + ((opts.expires || 5 * 60) * 1000);
    }

    this.attributeCache[url] = {
      expires: expires,
      value: instance.toJSON()
    };
    this.setLocalStorage();
  };

  Backbone.Collection.setLocalStorage = function() {
    if (!supportLocalStorage || !Backbone.Collection.localStorageCache) { return; }
    localStorage.setItem('collectionCache', JSON.stringify(Backbone.Collection.attributeCache));
  };

  Backbone.Collection.getLocalStorage = function() {
    if (!supportLocalStorage || !Backbone.Collection.localStorageCache) { return; }
    Backbone.Collection.attributeCache = JSON.parse(localStorage.getItem('collectionCache')) || {};
  };

  // Instance methods
  Backbone.Collection.prototype.fetch = function(opts) {
    opts = (opts || {});
    var url = _.isFunction(this.url) ? this.url() : this.url,
        data = Backbone.Collection.attributeCache[url],
        expired = false, attributes = false;

    if (data) {
      expired = data.expires;
      expired = expired && data.expires < (new Date()).getTime();
      attributes = data.value;
    }

    if (!expired && opts.cache && attributes) {
      this[opts.add ? 'add' : 'reset'](this.parse(attributes), opts);
      if (_.isFunction(opts.success)) { opts.success(this); }
      // Mimic actual fetch behaviour buy returning a fulfulled promise
      return ( new $.Deferred() ).resolve(this);
    }

    // Delegate to the actual fetch method and store the attibutes in the cache
    return superFetch.apply(this, arguments).done(
      _.bind(Backbone.Collection.setCache, Backbone.Collection, this, opts)
    );
  };

  // Prime the cache from localStorage on initialization
  Backbone.Collection.getLocalStorage();
})();