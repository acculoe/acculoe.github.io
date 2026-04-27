/* ========================================
   ACCULOE — Audio Engine
   Ambient layers + whisper + hover sounds
   ======================================== */

(function () {
  'use strict';

  var audioCtx = null;
  var isMuted = false;
  var isStarted = false;
  var masterGain = null;

  /* --- Layer references --- */
  var roomTone = null;
  var fanHum = null;
  var thockSamples = [];
  var thockIndex = 0;
  var thockTimer = null;
  var whisper = null;
  var hoverSound = null;

  /* --- Volume levels (0 to 1) --- */
  var VOLUMES = {
    roomTone: 0.18,
    fanHum: 0.12,
    thock: 0.28,
    whisper: 0.4,
    hover: 0.09
  };

  /* --- Create an audio element helper --- */
  function createAudio(src, loop, volume) {
    var a = new Audio();
    a.src = src;
    a.loop = loop;
    a.volume = volume;
    a.preload = 'auto';
    return a;
  }

  /* --- Start the ambient layers --- */
  function startAmbient() {
    if (isStarted) return;
    isStarted = true;

    /* Room tone — constant low hum */
    roomTone = createAudio('audio/room-tone.mp3', true, VOLUMES.roomTone);
    roomTone.play().catch(function () {});

    /* Fan hum — constant soft air */
    fanHum = createAudio('audio/fan-hum.mp3', true, VOLUMES.fanHum);
    fanHum.play().catch(function () {});

    /* Preload thock samples */
    thockSamples = [
      createAudio('audio/thock-01.mp3', false, VOLUMES.thock),
      createAudio('audio/thock-02.mp3', false, VOLUMES.thock),
      createAudio('audio/thock-03.mp3', false, VOLUMES.thock)
    ];

    /* Hover sound */
    hoverSound = createAudio('audio/hover-soft.mp3', false, VOLUMES.hover);

    /* Whisper — plays once after 3 seconds */
    whisper = createAudio('audio/built-quiet.mp3', false, VOLUMES.whisper);
    setTimeout(function () {
      if (!isMuted) {
        whisper.play().catch(function () {});
      }
    }, 3000);

    /* Start random thock loop */
    scheduleThock();

    /* Show mute toggle as active */
    var toggle = document.getElementById('mute-toggle');
    if (toggle) {
      toggle.classList.add('playing');
    }
  }

  /* --- Random thock every 8-20 seconds --- */
  function scheduleThock() {
    var delay = 8000 + Math.random() * 12000;
    thockTimer = setTimeout(function () {
      playThock();
      scheduleThock();
    }, delay);
  }

  function playThock() {
    if (isMuted) return;
    if (thockSamples.length === 0) return;

    var sample = thockSamples[thockIndex];
    thockIndex = (thockIndex + 1) % thockSamples.length;

    /* Reset and play */
    sample.currentTime = 0;
    sample.play().catch(function () {});
  }

  /* --- Play hover sound (called by room.js) --- */
  function playHover() {
    if (isMuted) return;
    if (!hoverSound) return;
    hoverSound.currentTime = 0;
    hoverSound.play().catch(function () {});
  }

  /* --- Mute / Unmute --- */
  function toggleMute() {
    isMuted = !isMuted;

    var allAudio = [roomTone, fanHum, whisper, hoverSound].concat(thockSamples);
    for (var i = 0; i < allAudio.length; i++) {
      if (allAudio[i]) {
        allAudio[i].muted = isMuted;
      }
    }

    var toggle = document.getElementById('mute-toggle');
    if (toggle) {
      if (isMuted) {
        toggle.classList.remove('playing');
        toggle.classList.add('muted');
      } else {
        toggle.classList.remove('muted');
        toggle.classList.add('playing');
      }
    }

    /* Save preference */
    try {
      localStorage.setItem('acculoe-muted', isMuted ? '1' : '0');
    } catch (e) {}
  }

  /* --- Load mute preference --- */
  function loadMutePreference() {
    try {
      var saved = localStorage.getItem('acculoe-muted');
      if (saved === '1') {
        isMuted = true;
      }
    } catch (e) {}
  }

  /* --- Init --- */
  function init() {
    loadMutePreference();

    /* Mute toggle button */
    var toggle = document.getElementById('mute-toggle');
    if (toggle) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMute();
      });
    }
  }

  /* --- Expose globally --- */
  window.AcculoeAudio = {
    start: startAmbient,
    playHover: playHover,
    isStarted: function () { return isStarted; }
  };

  /* --- Run init on DOM ready --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
