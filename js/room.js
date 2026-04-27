/* ========================================
   ACCULOE — Room Engine
   Gate, hotspots, product grid, panels
   ======================================== */

(function () {
  'use strict';

  var products = [];
  var currentProduct = null;

  /* --- Load products.json --- */
  function loadProducts() {
    fetch('products.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        products = data.filter(function (p) { return p.active; });

        if (window.AcculoeCart) {
          window.AcculoeCart.setProducts(products);
        }

        buildGrid();
        bindHotspots();

        if (window.AcculoeTransitions) {
          window.AcculoeTransitions.initScrollFade();
        }
      })
      .catch(function (err) {
        console.log('Failed to load products:', err);
      });
  }

  /* --- Build product grid --- */
  function buildGrid() {
    var grid = document.getElementById('product-grid');
    if (!grid) return;

    for (var i = 0; i < products.length; i++) {
      var p = products[i];

      var card = document.createElement('div');
      card.className = 'product-card';
      card.setAttribute('data-product', p.id);

      card.innerHTML =
        '<div class="product-card-image">' +
          '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<div class=placeholder-icon></div>\'">' +
        '</div>' +
        '<div class="product-card-body">' +
          '<div class="product-card-name">' + p.name + '</div>' +
          '<div class="product-card-tagline">' + p.tagline + '</div>' +
          '<div class="product-card-price">$' + p.price.toFixed(2) + '</div>' +
        '</div>';

      (function (product) {
        card.addEventListener('click', function () {
          if (window.AcculoeAudio) {
            window.AcculoeAudio.playClick();
          }
          openPanel(product);
        });
      })(p);

      grid.appendChild(card);
    }
  }

  /* --- Bind room hotspots --- */
  function bindHotspots() {
    var hotspots = document.querySelectorAll('.hotspot');

    for (var i = 0; i < hotspots.length; i++) {
      (function (hotspot) {
        var productId = hotspot.getAttribute('data-product');
        var product = findProduct(productId);

        if (!product) {
          hotspot.style.display = 'none';
          return;
        }

        hotspot.addEventListener('click', function (e) {
          e.stopPropagation();
          if (window.AcculoeAudio) {
            window.AcculoeAudio.playClick();
          }
          openPanel(product);
        });
      })(hotspots[i]);
    }
  }

  /* --- Find product by ID --- */
  function findProduct(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  /* --- Open product panel --- */
  function openPanel(product) {
    currentProduct = product;

    var panel = document.getElementById('product-panel');
    var overlay = document.getElementById('panel-overlay');
    var imageEl = document.getElementById('panel-image');
    var nameEl = document.getElementById('panel-name');
    var taglineEl = document.getElementById('panel-tagline');
    var descEl = document.getElementById('panel-description');
    var priceEl = document.getElementById('panel-price');
    var addBtn = document.getElementById('btn-add');

    if (window.AcculoeCart) {
      window.AcculoeCart.closeCart();
    }

    if (imageEl) {
      imageEl.innerHTML = '<img src="' + product.image + '" alt="' + product.name + '" onerror="this.style.display=\'none\'">';
    }
    if (nameEl) nameEl.textContent = product.name;
    if (taglineEl) taglineEl.textContent = product.tagline;
    if (descEl) descEl.textContent = product.description;
    if (priceEl) priceEl.textContent = '$' + product.price.toFixed(2);

    if (addBtn) {
      addBtn.textContent = 'Add to Room';
      addBtn.classList.remove('added');
    }

    if (panel) panel.classList.add('active');
    if (overlay) overlay.classList.add('active');
  }

  /* --- Close product panel --- */
  function closePanel() {
    var panel = document.getElementById('product-panel');
    var overlay = document.getElementById('panel-overlay');
    if (panel) panel.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    currentProduct = null;
  }

  /* --- Add to Room button --- */
  function handleAddToRoom() {
    if (!currentProduct) return;

    if (window.AcculoeCart) {
      window.AcculoeCart.add(currentProduct.id);
    }

    if (window.AcculoeAudio) {
      window.AcculoeAudio.playCart();
    }

    var btn = document.getElementById('btn-add');
    if (btn) {
      btn.textContent = 'Added';
      btn.classList.add('added');

      setTimeout(function () {
        btn.textContent = 'Add to Room';
        btn.classList.remove('added');
      }, 1500);
    }
  }

  /* --- Entry Gate --- */
  function initGate() {
    var gate = document.getElementById('gate');
    var enterBtn = document.getElementById('gate-enter');

    if (!gate || !enterBtn) return;

    enterBtn.addEventListener('click', function () {
      gate.classList.add('gone');

      if (window.AcculoeAudio) {
        window.AcculoeAudio.start();
      }

      var heroBg = document.getElementById('hero-bg');
      if (heroBg) {
        setTimeout(function () {
          heroBg.classList.add('loaded');
        }, 400);
      }

      setTimeout(function () {
        if (gate.parentNode) {
          gate.parentNode.removeChild(gate);
        }
      }, 1500);
    });
  }

  /* --- Mute toggle --- */
  function initMuteToggle() {
    var muteBtn = document.getElementById('mute-toggle');
    if (!muteBtn) return;

    if (window.AcculoeAudio && window.AcculoeAudio.isMuted()) {
      muteBtn.classList.add('is-muted');
    }

    muteBtn.addEventListener('click', function () {
      if (!window.AcculoeAudio) return;
      var nowMuted = window.AcculoeAudio.toggleMute();
      if (nowMuted) {
        muteBtn.classList.add('is-muted');
      } else {
        muteBtn.classList.remove('is-muted');
      }
    });
  }

  /* --- Init --- */
  function init() {
    initGate();
    initMuteToggle();
    loadProducts();

    var closeBtn = document.getElementById('panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closePanel();
      });
    }

    var addBtn = document.getElementById('btn-add');
    if (addBtn) {
      addBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        handleAddToRoom();
      });
    }

    var heroBg = document.getElementById('hero-bg');
    if (heroBg) {
      var img = new Image();
      img.onload = function () {
        heroBg.setAttribute('data-loaded', 'true');
      };
      img.src = 'img/room.png';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();