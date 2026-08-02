/* =========================================================
   POTSEC CATERING FOODS — shared cart logic
   Used on menu.html and order.html so items added from either
   page stay in sync, and the header cart badge stays current.
   ========================================================= */
(function () {
    var STORAGE_KEY = 'potsec_cart_v1';
    var DELIVERY_FEE = 5;
    var lastCount = 0;

    function getCart() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch (e) { /* storage unavailable, cart just won't persist */ }
        updateCartBadges();
        document.dispatchEvent(new CustomEvent('potsec:cart-change', { detail: cart }));
        return cart;
    }

    function setQty(name, price, qty) {
        var cart = getCart();
        if (qty <= 0) {
            delete cart[name];
        } else {
            cart[name] = { qty: qty, price: price };
        }
        return saveCart(cart);
    }

    function changeQty(name, price, delta) {
        var cart = getCart();
        var current = cart[name] ? cart[name].qty : 0;
        var next = Math.max(0, current + delta);
        return setQty(name, price, next);
    }

    function cartCount(cart) {
        cart = cart || getCart();
        return Object.keys(cart).reduce(function (sum, name) {
            return sum + cart[name].qty;
        }, 0);
    }

    function cartSubtotal(cart) {
        cart = cart || getCart();
        return Object.keys(cart).reduce(function (sum, name) {
            return sum + cart[name].qty * cart[name].price;
        }, 0);
    }

    function formatMoney(n) {
        return '\u20B5' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function updateCartBadges() {
        var count = cartCount();
        document.querySelectorAll('.cart-count').forEach(function (el) {
            el.textContent = count;
            var link = el.closest('.cart-link');
            if (link) {
                link.classList.toggle('has-items', count > 0);
                if (count > lastCount) {
                    link.classList.remove('bump');
                    void link.offsetWidth; /* restart animation */
                    link.classList.add('bump');
                }
            }
        });
        lastCount = count;
    }

    function wireSteppers(root) {
        root = root || document;
        var cart = getCart();
        root.querySelectorAll('[data-name][data-price]').forEach(function (card) {
            var name = card.dataset.name;
            var price = parseFloat(card.dataset.price);
            var countEl = card.querySelector('.step-count');
            if (!countEl) { return; }
            countEl.textContent = cart[name] ? cart[name].qty : 0;

            card.querySelectorAll('.step-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var delta = btn.dataset.action === 'inc' ? 1 : -1;
                    var updated = changeQty(name, price, delta);
                    countEl.textContent = updated[name] ? updated[name].qty : 0;
                });
            });

            var addBtn = card.querySelector('.add-btn');
            if (addBtn) {
                addBtn.addEventListener('click', function () {
                    var current = parseInt(countEl.textContent, 10) || 0;
                    var updated;
                    if (current === 0) {
                        updated = changeQty(name, price, 1);
                        countEl.textContent = updated[name] ? updated[name].qty : 0;
                    }
                    addBtn.classList.remove('just-added');
                    void addBtn.offsetWidth;
                    addBtn.classList.add('just-added');
                });
            }
        });
    }

    /* ---------- mini-cart dropdown (header icon) ---------- */
    function renderDropdown(panel) {
        var cart = getCart();
        var names = Object.keys(cart);
        var list = panel.querySelector('.cart-dropdown-list');
        var empty = panel.querySelector('.cart-dropdown-empty');
        var totalRow = panel.querySelector('.cart-dropdown-total-row');
        var subtotalEl = panel.querySelector('.cart-dropdown-subtotal');
        var cta = panel.querySelector('.cart-dropdown-cta');

        list.innerHTML = '';

        if (!names.length) {
            empty.style.display = 'block';
            list.style.display = 'none';
            totalRow.style.display = 'none';
            cta.textContent = 'Browse the Menu';
            cta.setAttribute('href', 'menu.html');
            return;
        }

        empty.style.display = 'none';
        list.style.display = 'block';
        totalRow.style.display = 'flex';
        cta.textContent = 'View Full Order';
        cta.setAttribute('href', 'order.html');

        names.forEach(function (name) {
            var item = cart[name];
            var li = document.createElement('li');

            var nameSpan = document.createElement('span');
            nameSpan.className = 'cart-dropdown-item-name';
            nameSpan.textContent = name;

            var qtySpan = document.createElement('span');
            qtySpan.className = 'cart-dropdown-item-qty';
            qtySpan.textContent = '\u00D7' + item.qty;

            var priceSpan = document.createElement('span');
            priceSpan.className = 'cart-dropdown-item-price';
            priceSpan.textContent = formatMoney(item.qty * item.price);

            var removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'cart-dropdown-remove';
            removeBtn.setAttribute('aria-label', 'Remove ' + name);
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', function () {
                setQty(name, item.price, 0);
            });

            li.appendChild(nameSpan);
            li.appendChild(qtySpan);
            li.appendChild(priceSpan);
            li.appendChild(removeBtn);
            list.appendChild(li);
        });

        subtotalEl.textContent = formatMoney(cartSubtotal(cart));
    }

    function closeAllDropdowns(except) {
        document.querySelectorAll('.cart-widget.is-open').forEach(function (w) {
            if (w !== except) {
                w.classList.remove('is-open');
                var link = w.querySelector('.cart-link');
                if (link) { link.setAttribute('aria-expanded', 'false'); }
            }
        });
    }

    function initCartDropdown() {
        var links = document.querySelectorAll('.cart-link');
        if (!links.length) { return; }

        links.forEach(function (link) {
            if (link.closest('.cart-widget')) { return; } /* already wired */

            var wrapper = document.createElement('div');
            wrapper.className = 'cart-widget';
            link.parentNode.insertBefore(wrapper, link);
            wrapper.appendChild(link);

            link.setAttribute('aria-haspopup', 'true');
            link.setAttribute('aria-expanded', 'false');

            var panel = document.createElement('div');
            panel.className = 'cart-dropdown';
            panel.innerHTML =
                '<div class="cart-dropdown-head">Your Order</div>' +
                '<div class="cart-dropdown-empty">Your cart is empty.</div>' +
                '<ul class="cart-dropdown-list"></ul>' +
                '<div class="cart-dropdown-total-row"><span>Subtotal</span><span class="cart-dropdown-subtotal">' + formatMoney(0) + '</span></div>' +
                '<a class="btn btn-primary btn-block cart-dropdown-cta" href="order.html">View Full Order</a>';
            wrapper.appendChild(panel);

            link.addEventListener('click', function (e) {
                e.preventDefault();
                var isOpen = wrapper.classList.toggle('is-open');
                link.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                if (isOpen) {
                    closeAllDropdowns(wrapper);
                    renderDropdown(panel);
                }
            });

            renderDropdown(panel);
        });

        document.addEventListener('click', function (e) {
            document.querySelectorAll('.cart-widget.is-open').forEach(function (w) {
                if (!w.contains(e.target)) {
                    w.classList.remove('is-open');
                    var link = w.querySelector('.cart-link');
                    if (link) { link.setAttribute('aria-expanded', 'false'); }
                }
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { closeAllDropdowns(); }
        });

        document.addEventListener('potsec:cart-change', function () {
            document.querySelectorAll('.cart-widget .cart-dropdown').forEach(renderDropdown);
        });
    }

    window.PotsecCart = {
        getCart: getCart,
        setQty: setQty,
        changeQty: changeQty,
        cartCount: cartCount,
        cartSubtotal: cartSubtotal,
        formatMoney: formatMoney,
        updateCartBadges: updateCartBadges,
        wireSteppers: wireSteppers,
        DELIVERY_FEE: DELIVERY_FEE
    };

    document.addEventListener('DOMContentLoaded', function () {
        updateCartBadges();
        initCartDropdown();
    });
})();
