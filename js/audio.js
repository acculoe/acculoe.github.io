(function () {
  'use strict';

  var muted = localStorage.getItem('acculoe-muted') === 'true';
  var started = false;

  /* ── Create audio element ───────────────────── */
  function makeAudio(src, vol) {
    var a = new Audio(src);
    a.volume = vol;
    a.preload = 'auto';
    return a;
  }

  /* ── Audio pool — fixes mobile replay lag ───── */
  function makePool(src, vol, size) {
    var pool = [];
    for (var i = 0; i < size; i++) {
      pool.push(makeAudio(src, vol));
    }
    var index = 0;
    return {
      play: function () {
        if (muted) return;
        var a = pool[index];
        index = (index + 1) % pool.length;
        a.currentTime = 0;
        a.play().catch(function () {});
      },
      unlock: function () {
        pool.forEach(function (a) {
          var v = a.volume;
          a.volume = 0;
          a.play().then(function () {
            a.pause();
            a.currentTime = 0;
            a.volume = v;
          }).catch(function () {
            a.volume = v;
          });
        });
      }
    };
  }

  /* ── Audio elements ─────────────────────────── */
  var whisper = makeAudio('audio/acculoe-built-quiet.mp3', 0.4);

  var piano = makeAudio('audio/ambient-piano.mp3', 0);
  piano.loop = true;

  var clickPool = makePool('audio/click-soft.mp3', 0.15, 4);
  var cartPool = makePool('audio/cart-confirm.mp3', 0.18, 3);

  /* ── Fade helper ────────────────────────────── */
  function fadeTo(audio, target, duration) {
    var steps = 30;
    var interval = duration / steps;
    var delta = (target - audio.volume) / steps;
    var step = 0;
    var timer = setInterval(function () {
      step++;
      audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
      if (step >= steps) {
        audio.volume = Math.min(1, Math.max(0, target));
        clearInterval(timer);
      }
    }, interval);
  }

  /* ── Unlock all pools (silent, on gate tap) ─── */
  function unlockAll() {
    clickPool.unlock();
    cartPool.unlock();
  }

  /* ── Start (called on gate enter) ───────────── */
  function start() {
    if (started) return;
    started = true;

    unlockAll();

    if (muted) return;

    setTimeout(function () {
      if (!muted) {
        whisper.currentTime = 0;
        whisper.play().catch(function () {});
      }
    }, 1000);

    setTimeout(function () {
      if (!muted) {
        piano.volume = 0;
        piano.currentTime = 0;
        piano.play().catch(function () {});
        fadeTo(piano, 0.18, 4000);
      }
    }, 4000);
  }

  /* ── Mute toggle ────────────────────────────── */
  function toggleMute() {
    muted = !muted;
    localStorage.setItem('acculoe-muted', muted);

    if (muted) {
      whisper.pause();
      piano.pause();
    } else if (started) {
      piano.volume = 0;
      piano.play().catch(function () {});
      fadeTo(piano, 0.18, 2000);
    }

    return muted;
  }

  /* ── Public API ─────────────────────────────── */
  window.AcculoeAudio = {
    start: start,
    toggleMute: toggleMute,
    isMuted: function () { return muted; },
    playClick: function () { clickPool.play(); },
    playCart: function () { cartPool.play(); }
  };
})();