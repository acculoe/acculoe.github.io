/* ========================================
   ACCULOE — Cart System
   localStorage cart + Stripe checkout
   ======================================== */

(function () {
  'use strict';

  /* --- Config --- */
  var WORKER_URL = 'https://acculoe-checkout.YOUR_SUBDOMAIN.workers.dev';
  /* Replace YOUR_SUBDOMAIN with your Cloudflare Workers subdomain once set up */

  /* --- State --- */
  var cart = [];
  var products = [];

  /* --- Load cart from localStorage --- */
  function loadCart() {
    try {
      var saved = localStorage.getItem('acculoe-cart');
      if (saved) {
        cart = JSON.parse(saved);
      }
    } catch (e) {
      cart = [];
    }
  }

  /* --- Save cart to localStorage --- */
  function saveCart() {
    try {
      localStorage.setItem('acculoe-cart', JSON.stringify(cart));
    } catch (e) {}
  }

  /* --- Get cart count --- */
  function getCount() {
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      total += cart[i].qty;
    }
    return total;
  }

  /* --- Get subtotal --- */
  function getSubtotal() {
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      var product = findProduct(cart[i].id);
      if (product) {
        total += product.price * cart[i].qty;
      }
    }
    return total;
  }

  /* --- Find product by ID --- */
  function findProduct(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  /* --- Find cart item by ID --- */
  function findCartItem(id) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) return cart[i];
    }
    return null;
  }

  /* --- Add to cart --- */
  function addToCart(productId) {
    var existing = findCartItem(productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: productId, qty: 1 });
    }
    saveCart();
    updateCartCount();
    renderCart();
  }

  /* --- Remove from cart --- */
  function removeFromCart(productId) {
    cart = cart.filter(function (item) {
      return item.id !== productId;
    });
    saveCart();
    updateCartCount();
    renderCart();
  }

  /* --- Update quantity --- */
  function updateQty(productId, delta) {
    var item = findCartItem(productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(productId);
      return;
    }
    saveCart();
    updateCartCount();
    renderCart();
  }

  /* --- Update nav cart count --- */
  function updateCartCount() {
    var el = document.getElementById('cart-count');
    if (el) {
      el.textContent = getCount();
    }
  }

  /* --- Render cart panel contents --- */
  function renderCart() {
    var container = document.getElementById('cart-items');
    var emptyMsg = document.getElementById('cart-empty');
    var footer = document.getElementById('cart-footer');
    var subtotalEl = document.getElementById('cart-subtotal');

    if (!container) return;

    /* Clear existing items (keep empty message) */
    var existingItems = container.querySelectorAll('.cart-item');
    for (var i = 0; i < existingItems.length; i++) {
      existingItems[i].remove();
    }

    if (cart.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'flex';
      if (footer) footer.style.display = 'none';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (footer) footer.style.display = 'block';

    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var product = findProduct(item.id);
      if (!product) continue;

      var div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML =
        '<div class="cart-item-image">' +
          '<img src="' + product.image + '" alt="' + product.name + '">' +
        '</div>' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + product.name + '</div>' +
          '<div class="cart-item-price">$' + product.price.toFixed(2) + '</div>' +
          '<div class="cart-item-qty">' +
            '<button class="qty-minus" data-id="' + product.id + '">-</button>' +
            '<span>' + item.qty + '</span>' +
            '<button class="qty-plus" data-id="' + product.id + '">+</button>' +
          '</div>' +
          '<button class="cart-item-remove" data-id="' + product.id + '">Remove</button>' +
        '</div>';

      container.appendChild(div);
    }

    /* Bind quantity buttons */
    var minusBtns = container.querySelectorAll('.qty-minus');
    for (var i = 0; i < minusBtns.length; i++) {
      minusBtns[i].addEventListener('click', function () {
        updateQty(this.getAttribute('data-id'), -1);
      });
    }

    var plusBtns = container.querySelectorAll('.qty-plus');
    for (var i = 0; i < plusBtns.length; i++) {
      plusBtns[i].addEventListener('click', function () {
        updateQty(this.getAttribute('data-id'), 1);
      });
    }

    /* Bind remove buttons */
    var removeBtns = container.querySelectorAll('.cart-item-remove');
    for (var i = 0; i < removeBtns.length; i++) {
      removeBtns[i].addEventListener('click', function () {
        removeFromCart(this.getAttribute('data-id'));
      });
    }

    /* Update subtotal */
    if (subtotalEl) {
      subtotalEl.textContent = '$' + getSubtotal().toFixed(2);
    }
  }

  /* --- Open cart panel --- */
  function openCart() {
    var panel = document.getElementById('cart-panel');
    var overlay = document.getElementById('panel-overlay');
    /* Close product panel if open */
    closeProductPanel();
    if (panel) panel.classList.add('active');
    if (overlay) overlay.classList.add('active');
    renderCart();
  }

  /* --- Close cart panel --- */
  function closeCart() {
    var panel = document.getElementById('cart-panel');
    var overlay = document.getElementById('panel-overlay');
    if (panel) panel.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  }

  /* --- Close product panel (helper) --- */
  function closeProductPanel() {
    var panel = document.getElementById('product-panel');
    if (panel) panel.classList.remove('active');
  }

  /* --- Stripe Checkout --- */
  function checkout() {
    if (cart.length === 0) return;

    /* Build line items for worker */
    var lineItems = [];
    for (var i = 0; i < cart.length; i++) {
      var product = findProduct(cart[i].id);
      if (product) {
        lineItems.push({
          price: product.stripe_price_id,
          quantity: cart[i].qty
        });
      }
    }

    var btn = document.getElementById('btn-checkout');
    if (btn) {
      btn.textContent = 'Processing...';
      btn.disabled = true;
    }

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line_items: lineItems })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.url) {
        window.location.href = data.url;
      } else {
        if (btn) {
          btn.textContent = 'Continue to Checkout';
          btn.disabled = false;
        }
      }
    })
    .catch(function () {
      if (btn) {
        btn.textContent = 'Continue to Checkout';
        btn.disabled = false;
      }
    });
  }

  /* --- Init --- */
  function init() {
    loadCart();
    updateCartCount();

    /* Cart toggle in nav */
    var cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
      cartToggle.addEventListener('click', function (e) {
        e.preventDefault();
        openCart();
      });
    }

    /* Cart close button */
    var cartClose = document.getElementById('cart-close');
    if (cartClose) {
      cartClose.addEventListener('click', function () {
        closeCart();
      });
    }

    /* Continue shopping */
    var continueShopping = document.getElementById('cart-continue-shopping');
    if (continueShopping) {
      continueShopping.addEventListener('click', function (e) {
        e.preventDefault();
        closeCart();
      });
    }

    /* Checkout button */
    var checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        checkout();
      });
    }

    /* Overlay click closes both panels */
    var overlay = document.getElementById('panel-overlay');
    if (overlay) {
      overlay.addEventListener('click', function () {
        closeCart();
        closeProductPanel();
        overlay.classList.remove('active');
      });
    }
  }

  /* --- Expose globally --- */
  window.AcculoeCart = {
    add: addToCart,
    setProducts: function (p) { products = p; },
    openCart: openCart,
    closeCart: closeCart
  };

  /* --- Run --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
