// TELOS Live API Module — single data source for all pages
// Auto-fetches /tools/live_data.json, retries on failure, notifies subscribers

var API = (function() {
  var data = null;
  var ready = false;
  var listeners = [];
  var timer = null;
  var retryTimer = null;

  function load() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tools/live_data.json?_=' + Date.now(), true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          data = JSON.parse(xhr.responseText);
          ready = true;
          var i;
          for (i = 0; i < listeners.length; i++) {
            try { listeners[i](data); } catch(e) {}
          }
        } catch(e) {}
      }
    };
    xhr.onerror = function() {
      if (!retryTimer) {
        retryTimer = setTimeout(function() {
          retryTimer = null;
          load();
        }, 5000);
      }
    };
    xhr.send();
  }

  return {
    start: function(opts) {
      opts = opts || {};
      var interval = opts.interval || 60000;
      load();
      if (timer) clearInterval(timer);
      timer = setInterval(load, interval);
    },
    onData: function(cb) {
      listeners.push(cb);
      if (ready && data) {
        try { cb(data); } catch(e) {}
      }
    },
    get: function(path) {
      if (!data) return null;
      var parts = path.split('.');
      var val = data;
      for (var i = 0; i < parts.length; i++) {
        if (val == null) return null;
        val = val[parts[i]];
      }
      return val;
    },
    isReady: function() { return ready; },
    getData: function() { return data; }
  };
})();
