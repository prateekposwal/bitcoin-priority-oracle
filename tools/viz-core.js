var VIZ = (function() {
  var anims = {};

  function create(id, opts) {
    opts = opts || {};
    var el = document.getElementById(id);
    if (!el) return null;
    var ctx = el.getContext('2d');
    var w = el.width = el.clientWidth || window.innerWidth;
    var h = el.height = opts.height || window.innerHeight;
    return { el: el, ctx: ctx, w: w, h: h };
  }

  function start(id, drawFn, interval) {
    interval = interval || 50;
    if (anims[id]) clearInterval(anims[id]);
    anims[id] = setInterval(function() {
      var el = document.getElementById(id);
      if (!el) return;
      var ctx = el.getContext('2d');
      var w = el.width = el.clientWidth || window.innerWidth;
      var h = el.height = el.clientHeight || window.innerHeight;
      try { drawFn(ctx, w, h, Date.now() / 1000); } catch(e) {}
    }, interval);
  }

  return { create: create, start: start };
})();
