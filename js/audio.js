(function () {
  'use strict';

  const AUDIO = {
    whisper: { src: 'audio/acculoe-built-quiet.mp3', volume: 0.4, loop: false },
    thock01: { src: 'audio/thock-01.mp3', volume: 0.28, loop: false },
    thock02: { src: 'audio/thock-02.mp3', volume: 0.28, loop: false },
    thock03: { src: 'audio/thock-03.mp3', volume: 0.28, loop: false },
    click: { src: 'audio/click-soft.mp3', volume: 0.15, loop: false },
    cart: { src: 'audio/cart-confirm.mp3', volume: 0.18, loop: false }
  };

  const elements = {};
  let muted = localStorage.getItem('acculoe-muted') === 'true';
  let started = false;
  let thockInterval = null;

  function init() {
    Object.keys(AUDIO).forEach(function (key) {
      var a = new Audio(AUDIO[key].src);
      a.volume = muted ? 0 : AUDIO[key].volume;
      a.loop = AUDIO[key].loop;
      a.preload = 'auto';
      elements[key] = a;
    });
  }

  function playSound(key) {
    if (muted || !started || !elements[key]) return;
    var el = elements[key];
    el.currentTime = 0;
    el.volume = AUDIO[key].volume;
    el.play().catch(function () {});
  }

  function randomThock() {
    var keys = ['thock01', 'thock02', 'thock03'];
    var pick = keys[Math.floor(Math.random() * keys.length)];
    playSound(pick);
  }

  function startThockLoop() {
    if (thockInterval) return;
    function scheduleNext() {
      var delay = 8000 + Math.random() * 12000;
      thockInterval = setTimeout(function () {
        randomThock();
        scheduleNext();
      }, delay);
    }
    scheduleNext();
  }

  function stopThockLoop() {
    if (thockInterval) {
      clearTimeout(thockInterval);
      thockInterval = null;
    }
  }

  function start() {
    if (started) return;
    started = true;

    setTimeout(function () {
      playSound('whisper');
    }, 3000);

    startThockLoop();
  }

  function toggleMute() {
    muted = !muted;
    localStorage.setItem('acculoe-muted', muted);

    Object.keys(elements).forEach(function (key) {
      elements[key].volume = muted ? 0 : AUDIO[key].volume;
    });

    if (muted) {
      stopThockLoop();
    } else if (started) {
      startThockLoop();
    }

    return muted;
  }

  function isMuted() {
    return muted;
  }

  init();

  window.AcculoeAudio = {
    start: start,
    toggleMute: toggleMute,
    isMuted: isMuted,
    playClick: function () { playSound('click'); },
    playCart: function () { playSound('cart'); },
    playThock: function () { randomThock(); }
  };
})();