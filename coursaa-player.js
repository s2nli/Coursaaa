/* Coursaa-style video player (vanilla port of the original coursaa component).
   Needs hls.js loaded first. Exposes window.CoursaaPlayer.
   API used by batch.js: new CoursaaPlayer(root, d, opts), .load(d), .save(), .destroy(), .v (video), .menu */
(function () {
  "use strict";

  var CSS = [
    ".cp{position:absolute;inset:0;background:#000;overflow:hidden;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;color:#fff;font-family:inherit}",
    ".cp:fullscreen{width:100vw;height:100vh}",
    ".cp video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;background:#000}",
    ".cp svg{display:block}",
    ".cp-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}",
    ".cp-spin{width:48px;height:48px;color:rgba(255,255,255,.5);animation:cpspin 1s linear infinite;display:none}",
    ".cp.busy .cp-spin{display:block}",
    "@keyframes cpspin{to{transform:rotate(360deg)}}",
    ".cp-big{width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center}",
    ".cp.paused:not(.busy) .cp-big{display:flex}",
    ".cp-big svg{width:32px;height:32px;margin-left:4px}",
    ".cp-flash{position:absolute;top:0;bottom:0;width:33.33%;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(255,255,255,.1);z-index:3;pointer-events:none;font-size:14px;font-weight:700}",
    ".cp-flash.show{display:flex}",
    ".cp-flash.l{left:0;border-radius:0 50% 50% 0}.cp-flash.r{right:0;border-radius:50% 0 0 50%}",
    ".cp-flash svg{width:40px;height:40px;margin-bottom:8px}",
    ".cp-top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:8px;padding:8px 12px 24px;background:linear-gradient(to bottom,rgba(0,0,0,.8),transparent);z-index:4;transition:opacity .3s}",
    ".cp-top button{background:none;border:0;color:#d4d4d8;padding:6px;border-radius:50%;cursor:pointer;display:flex}",
    ".cp-top button svg{width:24px;height:24px}",
    ".cp-ttl{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}",
    ".cp-ctl{position:absolute;left:0;right:0;bottom:0;padding:40px 16px 12px;background:linear-gradient(to top,rgba(0,0,0,.9),rgba(0,0,0,.6),transparent);z-index:4;transition:opacity .3s}",
    ".cp.hide .cp-ctl,.cp.hide .cp-top{opacity:0;pointer-events:none}",
    ".cp-prog{position:relative;height:6px;background:rgba(255,255,255,.2);border-radius:999px;cursor:pointer;margin-bottom:14px;touch-action:none;transition:height .15s}",
    ".cp-prog:hover,.cp-prog.drag{height:10px}",
    ".cp-prog:before{content:'';position:absolute;left:0;right:0;top:-12px;bottom:-12px}",
    ".cp-fill{position:absolute;top:0;left:0;height:100%;width:0;background:#6366f1;border-radius:999px}",
    ".cp-fill i{position:absolute;right:-7px;top:50%;width:14px;height:14px;margin-top:-7px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.5);transform:scale(0);transition:transform .15s}",
    ".cp-prog:hover .cp-fill i,.cp-prog.drag .cp-fill i{transform:scale(1)}",
    ".cp-row{display:flex;align-items:center;justify-content:space-between}",
    ".cp-l,.cp-r{display:flex;align-items:center;gap:16px}",
    ".cp-r{gap:12px}",
    ".cp-b{background:none;border:0;color:#fff;padding:0;cursor:pointer;display:flex;align-items:center;transition:color .2s}",
    ".cp-b:hover{color:#818cf8}",
    ".cp-b svg{width:24px;height:24px}",
    ".cp-b.sm svg{width:20px;height:20px}",
    ".cp-vol{display:flex;align-items:center;gap:8px}",
    ".cp-vol input{width:0;overflow:hidden;height:4px;transition:width .2s;accent-color:#fff;cursor:pointer}",
    ".cp-vol:hover input{width:80px}",
    "@media (hover:none){.cp-vol input{display:none}}",
    ".cp-time{font-size:12px;color:#d4d4d8;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:nowrap}",
    ".cp-set{position:relative}",
    ".cp-gear{background:none;border:0;color:#d4d4d8;padding:6px;border-radius:50%;cursor:pointer;display:flex;transition:all .2s}",
    ".cp-gear svg{width:20px;height:20px}",
    ".cp-gear:hover{color:#fff;transform:rotate(45deg)}",
    ".cp-gear.on{background:rgba(255,255,255,.1);color:#fff;transform:rotate(45deg)}",
    ".cp-pop{position:absolute;bottom:100%;right:0;margin-bottom:16px;width:240px;background:rgba(0,0,0,.95);border:1px solid #27272a;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.6);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}",
    ".cp-pop[hidden]{display:none}",
    ".cp-pi{padding:4px;max-height:300px;overflow-y:auto}",
    ".cp-sec{padding:12px}",
    ".cp-sec+.cp-sec{border-top:1px solid rgba(255,255,255,.1)}",
    ".cp-h{font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;margin:0 0 8px 4px}",
    ".cp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}",
    ".cp-sp{background:none;border:0;color:#d4d4d8;font-size:12px;padding:6px 0;border-radius:6px;cursor:pointer;font-family:inherit}",
    ".cp-sp:hover{background:rgba(255,255,255,.1)}",
    ".cp-sp.on{background:#4f46e5;color:#fff}",
    ".cp-q{width:100%;text-align:left;background:none;border:0;color:#d4d4d8;font-size:14px;padding:8px 12px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:2px;font-family:inherit}",
    ".cp-q:hover{background:rgba(255,255,255,.05)}",
    ".cp-q.on{background:rgba(255,255,255,.1);color:#818cf8}",
    ".cp-q svg{width:14px;height:14px}",
    ".cp-err{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(0,0,0,.85);z-index:5;text-align:center;padding:16px}",
    ".cp.failed .cp-err{display:flex}",
    ".cp-err p{margin:0;font-size:14px;color:#d4d4d8}",
    ".cp-err button{background:#4f46e5;color:#fff;border:0;border-radius:999px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer}",
    /* info block under the player (title, duration, nav, lecture list) */
    ".lv-info{flex:1;min-height:0;overflow-y:auto;background:#18181b;border-top:1px solid #27272a;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));color:#f4f4f5}",
    ".lvi-t{margin:0 0 8px;font-size:20px;line-height:1.3;font-weight:700;color:#fff}",
    ".lvi-d{font-size:14px;color:#71717a;min-height:20px}",
    ".lvi-nav{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}",
    ".lvi-nav button{background:#27272a;color:#e4e4e7;border:1px solid #3f3f46;border-radius:999px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}",
    ".lvi-nav button:disabled{opacity:.35}",
    ".lvi-list{margin-top:14px;display:flex;flex-direction:column;gap:2px}",
    ".lvi-list[hidden]{display:none}",
    ".lvi-it{display:flex;align-items:center;gap:12px;text-align:left;width:100%;background:none;border:0;border-radius:10px;padding:11px 12px;color:#d4d4d8;font-size:14px;cursor:pointer;font-family:inherit}",
    ".lvi-it span{min-width:26px;color:#71717a;font-size:12px}",
    ".lvi-it:hover{background:#27272a}",
    ".lvi-it.on{background:rgba(99,102,241,.15);color:#a5b4fc}",
    ".lvi-it.done span{color:#34d399}"
  ].join("\n");

  var P = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>"; };
  var F = function (d) { return '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round">' + d + "</svg>"; };
  var I = {
    play: F('<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/>'),
    pause: F('<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'),
    vol: P('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
    mute: P('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>'),
    gear: P('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
    full: P('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
    exit: P('<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>'),
    back: P('<path d="m15 18-6-6 6-6"/>'),
    check: P('<path d="M20 6 9 17l-5-5"/>'),
    spin: P('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>'),
    rew: P('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
    fwd: P('<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>')
  };

  var fmt = function (t) { if (!isFinite(t) || isNaN(t)) return "0:00"; var m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ":" + (s < 10 ? "0" : "") + s; };
  var SPEEDS = [0.5, 1, 1.25, 1.5, 1.75, 2];
  var cssDone = false;
  function injectCss() { if (cssDone) return; cssDone = true; var s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); }
  var lsGet = function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  var lsSet = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var lsDel = function (k) { try { localStorage.removeItem(k); } catch (e) {} };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  function CoursaaPlayer(root, d, opts) {
    injectCss();
    var self = this;
    this.o = opts || {};
    this.rate = 1; this.level = -1; this.levels = []; this.hls = null; this.d = null;
    this.lastTap = 0; this.hideT = null; this.lastSave = 0; this.retried = 0;
    var el = this.el = document.createElement("div");
    el.className = "cp paused hide";
    el.innerHTML =
      '<video playsinline></video>' +
      '<div class="cp-flash l"></div><div class="cp-flash r"></div>' +
      '<div class="cp-center"><div class="cp-spin">' + I.spin + '</div><div class="cp-big">' + I.play + '</div></div>' +
      '<div class="cp-err"><p>This lecture couldn\'t be played.</p><button type="button" data-k="retry">Try again</button></div>' +
      '<div class="cp-top"><button type="button" data-k="back" aria-label="Back">' + I.back + '</button><span class="cp-ttl"></span></div>' +
      '<div class="cp-ctl">' +
        '<div class="cp-prog"><div class="cp-fill"><i></i></div></div>' +
        '<div class="cp-row"><div class="cp-l">' +
          '<button type="button" class="cp-b" data-k="play" aria-label="Play/Pause">' + I.play + '</button>' +
          '<div class="cp-vol"><button type="button" class="cp-b sm" data-k="mute" aria-label="Mute">' + I.vol + '</button><input type="range" min="0" max="1" step="0.1" value="1" aria-label="Volume"></div>' +
          '<span class="cp-time">0:00 / 0:00</span></div>' +
        '<div class="cp-r"><div class="cp-set"><button type="button" class="cp-gear" data-k="gear" aria-label="Settings">' + I.gear + '</button><div class="cp-pop" hidden></div></div>' +
          '<button type="button" class="cp-b sm" data-k="full" aria-label="Fullscreen">' + I.full + '</button></div></div>' +
      '</div>';
    root.innerHTML = "";
    root.appendChild(el);
    var q = function (s) { return el.querySelector(s); };
    this.q = q;
    var v = this.v = q("video");
    this.prog = q(".cp-prog"); this.fill = q(".cp-fill"); this.time = q(".cp-time");
    this.pop = q(".cp-pop"); this.gear = q(".cp-gear");

    // ----- video events
    v.addEventListener("timeupdate", function () { self.tick(); });
    v.addEventListener("loadedmetadata", function () {
      v.playbackRate = self.rate;
      var d0 = self.d || {}, t = d0.startAt > 0 ? d0.startAt : (lsGet("lp:pos:" + d0.id, 0) || 0);
      if (t > 10 && isFinite(v.duration) && t < v.duration - 10) { try { v.currentTime = t; } catch (e) {} }
      self.tick();
      if (self.o.onDuration) self.o.onDuration(v.duration, d0);
    });
    v.addEventListener("waiting", function () { el.classList.add("busy"); });
    v.addEventListener("seeking", function () { if (!v.paused) el.classList.add("busy"); });
    v.addEventListener("canplay", function () { el.classList.remove("busy"); });
    v.addEventListener("playing", function () { el.classList.remove("busy", "paused", "failed"); self.setPlayIcon(true); self.show(); });
    v.addEventListener("pause", function () { el.classList.add("paused"); self.setPlayIcon(false); self.show(); self.save(); });
    v.addEventListener("ended", function () {
      el.classList.add("paused"); self.setPlayIcon(false); lsDel("lp:pos:" + (self.d && self.d.id));
      if (self.o.onEnded) self.o.onEnded(self.d);
    });
    v.addEventListener("error", function () { if (!self.hls) self.fail(); });
    v.addEventListener("volumechange", function () {
      q('[data-k="mute"]').innerHTML = (v.muted || v.volume === 0) ? I.mute : I.vol;
    });

    // ----- taps / double-tap seek (same behaviour as coursaa)
    el.addEventListener("click", function (e) {
      if (e.target.closest(".cp-ctl") || e.target.closest(".cp-top") || e.target.closest(".cp-err")) return;
      if (self.menu) { self.closeMenu(); return; }
      var r = el.getBoundingClientRect(), x = e.clientX - r.left, w = r.width, center = x > 0.3 * w && x < 0.7 * w, now = Date.now();
      self.show();
      if (center) { self.toggle(); self.lastTap = 0; return; }
      if (now - self.lastTap < 300) {
        if (x < 0.3 * w) { v.currentTime = Math.max(0, v.currentTime - 10); self.flash("l", "rew", "-10s"); }
        else { v.currentTime = Math.min(v.duration || 1e9, v.currentTime + 10); self.flash("r", "fwd", "+10s"); }
        self.lastTap = 0;
      } else self.lastTap = now;
    });
    el.addEventListener("mousemove", function () { self.show(); });

    // ----- buttons
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-k]"); if (!b) return;
      var k = b.dataset.k;
      if (k === "play") self.toggle();
      else if (k === "mute") { v.muted = !v.muted; }
      else if (k === "gear") { self.menu ? self.closeMenu() : self.openMenu(); }
      else if (k === "full") self.fullscreen();
      else if (k === "back") { if (self.o.onBack) self.o.onBack(); }
      else if (k === "retry") { self.retried = 0; if (self.d) self.load(self.d); }
      else if (k === "speed") { self.rate = +b.dataset.v; v.playbackRate = self.rate; self.closeMenu(); }
      else if (k === "q") { var i = +b.dataset.v; self.level = i; if (self.hls) self.hls.currentLevel = i; self.closeMenu(); }
    });
    q(".cp-vol input").addEventListener("input", function (e) { var t = parseFloat(e.target.value); v.volume = t; v.muted = t === 0; });
    document.addEventListener("mousedown", function (e) { if (self.menu && !e.target.closest(".cp-set")) self.closeMenu(); });
    document.addEventListener("touchstart", function (e) { if (self.menu && !e.target.closest(".cp-set")) self.closeMenu(); }, { passive: true });

    // ----- seeking on the progress bar (click + drag)
    var seekTo = function (cx) {
      var r = self.prog.getBoundingClientRect(), p = Math.min(1, Math.max(0, (cx - r.left) / r.width));
      if (isFinite(v.duration)) { v.currentTime = p * v.duration; self.tick(); }
    };
    var drag = false;
    this.prog.addEventListener("pointerdown", function (e) { drag = true; self.prog.classList.add("drag"); try { self.prog.setPointerCapture(e.pointerId); } catch (x) {} seekTo(e.clientX); e.stopPropagation(); });
    this.prog.addEventListener("pointermove", function (e) { if (drag) seekTo(e.clientX); });
    var end = function () { drag = false; self.prog.classList.remove("drag"); };
    this.prog.addEventListener("pointerup", end); this.prog.addEventListener("pointercancel", end);

    document.addEventListener("fullscreenchange", function () {
      q('[data-k="full"]').innerHTML = document.fullscreenElement === el ? I.exit : I.full;
    });
    document.addEventListener("keydown", function (e) {
      if (!el.offsetParent || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "")) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); self.toggle(); self.show(); }
      else if (e.key === "ArrowLeft") { v.currentTime = Math.max(0, v.currentTime - 10); self.flash("l", "rew", "-10s"); }
      else if (e.key === "ArrowRight") { v.currentTime = Math.min(v.duration || 1e9, v.currentTime + 10); self.flash("r", "fwd", "+10s"); }
      else if (e.key === "f") self.fullscreen();
    });
    window.addEventListener("pagehide", function () { self.save(); });

    this.load(d);
  }

  var proto = CoursaaPlayer.prototype;

  proto.setPlayIcon = function (playing) { this.q('[data-k="play"]').innerHTML = playing ? I.pause : I.play; };
  proto.toggle = function () { var v = this.v; if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); };
  proto.flash = function (side, icon, txt) {
    var f = this.q(".cp-flash." + side); f.innerHTML = I[icon] + "<span>" + txt + "</span>"; f.classList.add("show");
    clearTimeout(f._t); f._t = setTimeout(function () { f.classList.remove("show"); }, 500);
  };
  proto.show = function () {
    var self = this; this.el.classList.remove("hide"); clearTimeout(this.hideT);
    this.hideT = setTimeout(function () { if (!self.v.paused && !self.menu) self.el.classList.add("hide"); }, 3000);
  };
  proto.tick = function () {
    var v = this.v, d = v.duration, t = v.currentTime;
    this.fill.style.width = (isFinite(d) && d > 0 ? (t / d) * 100 : 0) + "%";
    this.time.textContent = fmt(t) + " / " + fmt(d);
    var now = Date.now();
    if (now - this.lastSave > 3000) { this.lastSave = now; this.save(); }
  };
  proto.save = function () {
    var v = this.v, id = this.d && this.d.id;
    if (!id || !isFinite(v.duration) || v.currentTime < 10) return;
    if (v.currentTime > v.duration - 10) lsDel("lp:pos:" + id); else lsSet("lp:pos:" + id, Math.floor(v.currentTime));
  };
  proto.fullscreen = function () {
    var el = this.el;
    try {
      if (document.fullscreenElement) { document.exitFullscreen(); try { screen.orientation.unlock(); } catch (e) {} }
      else {
        var p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        if (p && p.then) p.then(function () { try { screen.orientation.lock("landscape").catch(function () {}); } catch (e) {} }).catch(function () {});
      }
    } catch (e) { /* iOS Safari: element fullscreen unsupported */ try { this.v.webkitEnterFullscreen(); } catch (x) {} }
  };
  Object.defineProperty(proto, "menu", { get: function () { return !this.pop.hidden; } });
  proto.openMenu = function () {
    var self = this, h = '<div class="cp-pi"><div class="cp-sec"><div class="cp-h">Speed</div><div class="cp-grid">';
    SPEEDS.forEach(function (s) { h += '<button type="button" class="cp-sp' + (self.rate === s ? " on" : "") + '" data-k="speed" data-v="' + s + '">' + (s === 1 ? "Normal" : s + "x") + "</button>"; });
    h += "</div></div>";
    if (this.levels.length) {
      h += '<div class="cp-sec"><div class="cp-h">Quality</div>';
      h += '<button type="button" class="cp-q' + (this.level === -1 ? " on" : "") + '" data-k="q" data-v="-1">Auto' + (this.level === -1 ? I.check : "") + "</button>";
      this.levels.forEach(function (l) {
        h += '<button type="button" class="cp-q' + (self.level === l.i ? " on" : "") + '" data-k="q" data-v="' + l.i + '">' + esc(l.label) + (self.level === l.i ? I.check : "") + "</button>";
      });
      h += "</div>";
    }
    h += "</div>";
    this.pop.innerHTML = h; this.pop.hidden = false;
    // keep the popup inside short (phone) players; it scrolls inside
    var pi = this.pop.firstChild; if (pi) pi.style.maxHeight = Math.max(110, Math.min(300, this.el.clientHeight - 100)) + "px"; this.gear.classList.add("on"); this.show();
  };
  proto.closeMenu = function () { this.pop.hidden = true; this.gear.classList.remove("on"); this.show(); };
  proto.fail = function () { this.el.classList.remove("busy"); this.el.classList.add("failed"); this.show(); };

  proto.load = function (d) {
    var self = this, v = this.v, url = d.videoUrl;
    this.save();
    this.d = d; this.retried = 0; this.levels = []; this.level = -1;
    if (this.hls) { try { this.hls.destroy(); } catch (e) {} this.hls = null; }
    this.closeMenu();
    this.q(".cp-ttl").textContent = d.title || "";
    this.el.classList.remove("failed"); this.el.classList.add("busy", "paused");
    this.fill.style.width = "0%"; this.time.textContent = "0:00 / 0:00";
    var autoplay = d.autoplay !== false;
    var tryPlay = function () { if (autoplay) { var p = v.play(); if (p && p.catch) p.catch(function () { self.el.classList.remove("busy"); }); } else self.el.classList.remove("busy"); };
    try { v.pause(); v.removeAttribute("src"); v.load(); } catch (e) {}

    var isHls = /\.m3u8(\?|#|$)/i.test(url) || /\/hls\b/i.test(url);
    if (isHls && window.Hls && Hls.isSupported()) {
      // same settings as the original coursaa player
      var h = this.hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      h.loadSource(url);
      h.attachMedia(v);
      h.on(Hls.Events.MANIFEST_PARSED, function (_, data) {
        self.levels = data.levels.map(function (l, i) { return { i: i, height: l.height || 0, label: l.height ? l.height + "p" : (Math.round((l.bitrate || 0) / 1000) + "k") }; })
          .sort(function (a, b) { return b.height - a.height; });
        tryPlay();
      });
      h.on(Hls.Events.ERROR, function (_, x) {
        if (!x.fatal) return;
        if (x.type === Hls.ErrorTypes.NETWORK_ERROR && self.retried < 1) { self.retried = 1; h.startLoad(); }
        else if (x.type === Hls.ErrorTypes.MEDIA_ERROR && self.retried < 2) { self.retried = 2; h.recoverMediaError(); }
        else self.fail();
      });
    } else if (isHls && v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = url; v.addEventListener("loadedmetadata", tryPlay, { once: true });
    } else {
      v.src = url; v.load(); tryPlay();
    }
    this.setMediaSession(d);
    this.show();
  };

  proto.setMediaSession = function (d) {
    var self = this;
    try {
      if (!("mediaSession" in navigator)) return;
      navigator.mediaSession.metadata = new MediaMetadata({ title: d.title || "", artist: (d.course && d.course.title) || "", artwork: [{ src: "assets/icon-192.png", sizes: "192x192", type: "image/png" }] });
      navigator.mediaSession.setActionHandler("play", function () { self.v.play(); });
      navigator.mediaSession.setActionHandler("pause", function () { self.v.pause(); });
      navigator.mediaSession.setActionHandler("previoustrack", d.previousLecture ? function () { self.o.onNavigate && self.o.onNavigate(d.previousLecture); } : null);
      navigator.mediaSession.setActionHandler("nexttrack", d.nextLecture ? function () { self.o.onNavigate && self.o.onNavigate(d.nextLecture); } : null);
    } catch (e) {}
  };

  proto.destroy = function () {
    this.save();
    if (this.hls) { try { this.hls.destroy(); } catch (e) {} this.hls = null; }
    clearTimeout(this.hideT);
    this.el.remove();
  };

  window.CoursaaPlayer = CoursaaPlayer;
})();
