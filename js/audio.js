(function () {
  'use strict';

  var muted = localStorage.getItem('acculoe-muted') === 'true';
  var started = false;

  /* ── Audio elements ─────────────────────────── */
  var whisper = new Audio('audio/acculoe-built-quiet.mp3');
  whisper.volume = 0.4;
  whisper.preload = 'auto';

  var piano = new Audio('audio/ambient-piano.mp3');
  piano.volume = 0;
  piano.loop = true;
  piano.preload = 'auto';

  /* ── Clone-based sound player (no lag, no glitch) ── */
  function playSound(src, vol) {
    if (muted) return;
    var s = new Audio(src);
    s.volume = vol;
    s.play().catch(function () {});
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
    playClick: function () { playSound('audio/click-soft.mp3', 0.15); },
    playCart: function () { playSound('audio/cart-confirm.mp3', 0.18); }
  };
})();