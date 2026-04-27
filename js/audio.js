(function () {
  'use strict';

  var muted = localStorage.getItem('acculoe-muted') === 'true';
  var started = false;
  var unlocked = false;

  /* ── Audio elements ─────────────────────────── */
  var whisper = new Audio('audio/acculoe-built-quiet.mp3');
  whisper.volume = 0.4;
  whisper.preload = 'auto';

  var piano = new Audio('audio/ambient-piano.mp3');
  piano.volume = 0;
  piano.loop = true;
  piano.preload = 'auto';

  var click = new Audio('audio/click-soft.mp3');
  click.volume = 0.15;
  click.preload = 'auto';

  var cart = new Audio('audio/cart-confirm.mp3');
  cart.volume = 0.18;
  cart.preload = 'auto';

  /* ── Unlock all audio on first user gesture (mobile fix) ── */
  function unlockAudio() {
    if (unlocked) return;
    unlocked = true;

    [click, cart].forEach(function (a) {
      var origVol = a.volume;
      a.volume = 0;
      a.play().then(function () {
        a.pause();
        a.currentTime = 0;
        a.volume = origVol;
      }).catch(function () {
        a.volume = origVol;
      });
    });
  }

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

  /* ── Start (called on gate enter) ───────────── */
  function start() {
    if (started) return;
    started = true;

    unlockAudio();

    if (muted) return;

    setTimeout(function () {
      if (!muted) {
        whisper.currentTime = 0;
        whisper.play().catch(function () {});
      }
    }, 1000);

    setTimeout(function () {
      if (!muted) {
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

  /* ── UI sounds ──────────────────────────────── */
  function playClick() {
    if (muted) return;
    click.currentTime = 0;
    click.play().catch(function () {});
  }

  function playCart() {
    if (muted) return;
    cart.currentTime = 0;
    cart.play().catch(function () {});
  }

  /* ── Public API ─────────────────────────────── */
  window.AcculoeAudio = {
    start: start,
    toggleMute: toggleMute,
    isMuted: function () { return muted; },
    playClick: playClick,
    playCart: playCart
  };
})();