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

        /* Share products with cart */
        if (window.AcculoeCart) {
          window.AcculoeCart.setProducts(products);
        }

        buildGrid();
        bindHotspots();

        /* Init scroll animations after grid exists */
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

      /* Click opens product panel */
      (function (product) {
        card.addEventListener('click', function () {
          openPanel(product);
        });
      })(p);

      /* Hover sound */
      (function () {
        card.addEventListener('mouseenter', function () {
          if (window.AcculoeAudio) {
            window.AcculoeAudio.playHover();
          }
        });
      })();

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
          openPanel(product);
        });

        hotspot.addEventListener('mouseenter', function () {
          if (window.AcculoeAudio) {
            window.AcculoeAudio.playHover();
          }
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

    /* Close cart if open */
    if (window.AcculoeCart) {
      window.AcculoeCart.closeCart();
    }

    /* Fill content */
    if (imageEl) {
      imageEl.innerHTML = '<img src="' + product.image + '" alt="' + product.name + '" onerror="this.style.display=\'none\'">';
    }
    if (nameEl) nameEl.textContent = product.name;
    if (taglineEl) taglineEl.textContent = product.tagline;
    if (descEl) descEl.textContent = product.description;
    if (priceEl) priceEl.textContent = '$' + product.price.toFixed(2);

    /* Reset add button */
    if (addBtn) {
      addBtn.textContent = 'Add to Room';
      addBtn.classList.remove('added');
    }

    /* Show panel */
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
      /* Dissolve the gate */
      gate.classList.add('gone');

      /* Start audio */
      if (window.AcculoeAudio) {
        window.AcculoeAudio.start();
      }

      /* Fade in room image */
      var heroBg = document.getElementById('hero-bg');
      if (heroBg) {
        setTimeout(function () {
          heroBg.classList.add('loaded');
        }, 400);
      }

      /* Remove gate from DOM after transition */
      setTimeout(function () {
        if (gate.parentNode) {
          gate.parentNode.removeChild(gate);
        }
      }, 1500);
    });
  }

  /* --- Init --- */
  function init() {
    initGate();
    loadProducts();

    /* Panel close button */
    var closeBtn = document.getElementById('panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closePanel();
      });
    }

    /* Add to Room button */
    var addBtn = document.getElementById('btn-add');
    if (addBtn) {
      addBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        handleAddToRoom();
      });
    }

    /* Preload room image */
    var heroBg = document.getElementById('hero-bg');
    if (heroBg) {
      var img = new Image();
      img.onload = function () {
        heroBg.setAttribute('data-loaded', 'true');
      };
      img.src = 'img/room.png';
    }
  }

  /* --- Run --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
