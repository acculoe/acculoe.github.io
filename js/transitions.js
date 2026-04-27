/* ========================================
   ACCULOE — Transitions
   Scroll animations + smart nav hide
   ======================================== */

(function () {
  'use strict';

  /* --- Smart Nav: hide on scroll down, show on scroll up --- */
  var nav = document.getElementById('nav');
  var lastScroll = 0;
  var navHidden = false;

  function handleNavScroll() {
    var current = window.pageYOffset || document.documentElement.scrollTop;

    /* Don't hide nav at very top of page */
    if (current < 80) {
      if (navHidden) {
        nav.classList.remove('hidden');
        navHidden = false;
      }
      lastScroll = current;
      return;
    }

    /* Scrolling down — hide */
    if (current > lastScroll + 5 && !navHidden) {
      nav.classList.add('hidden');
      navHidden = true;
    }

    /* Scrolling up — show */
    if (current < lastScroll - 5 && navHidden) {
      nav.classList.remove('hidden');
      navHidden = false;
    }

    lastScroll = current;
  }

  /* --- Fade-in on scroll (IntersectionObserver) --- */
  function initScrollFade() {
    var cards = document.querySelectorAll('.product-card');
    if (cards.length === 0) return;

    /* If browser doesn't support IntersectionObserver, show all */
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < cards.length; i++) {
        cards[i].classList.add('visible');
      }
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          /* Stagger the fade-in based on index */
          var card = entries[i].target;
          var delay = card.dataset.index ? card.dataset.index * 120 : 0;
          setTimeout(function (c) {
            c.classList.add('visible');
          }, delay, card);
          observer.unobserve(card);
        }
      }
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    for (var i = 0; i < cards.length; i++) {
      cards[i].dataset.index = i;
      observer.observe(cards[i]);
    }
  }

  /* --- Brand statement fade --- */
  function initStatementFade() {
    var statement = document.querySelector('.brand-statement');
    if (!statement) return;

    statement.style.opacity = '0';
    statement.style.transform = 'translateY(20px)';
    statement.style.transition = 'opacity 1s ease, transform 1s ease';

    if (!('IntersectionObserver' in window)) {
      statement.style.opacity = '1';
      statement.style.transform = 'translateY(0)';
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        statement.style.opacity = '1';
        statement.style.transform = 'translateY(0)';
        observer.unobserve(statement);
      }
    }, {
      threshold: 0.2
    });

    observer.observe(statement);
  }

  /* --- Scroll listener (throttled) --- */
  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        handleNavScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  /* --- Expose init for room.js to call after grid is built --- */
  window.AcculoeTransitions = {
    initScrollFade: initScrollFade,
    initStatementFade: initStatementFade
  };

  /* --- Init statement fade on DOM ready --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initStatementFade();
    });
  } else {
    initStatementFade();
  }

})();
