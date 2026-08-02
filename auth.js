/* =========================================================
   POTSEC CATERING FOODS — simulated account state
   There's no real backend here, so "signing in" just remembers
   a name in this browser (localStorage) and swaps the header's
   Login/Signup button for the person's name wherever it appears.
   ========================================================= */
(function () {
    var STORAGE_KEY = 'potsec_user_v1';

    function getUser() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setUser(user) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } catch (e) { /* storage unavailable */ }
    }

    function clearUser() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* storage unavailable */ }
    }

    function nameFromEmail(email) {
        var local = (email || '').split('@')[0] || 'Guest';
        var parts = local.split(/[.\-_]+/).filter(Boolean);
        if (!parts.length) { return 'Guest'; }
        return parts.map(function (p) {
            return p.charAt(0).toUpperCase() + p.slice(1);
        }).join(' ');
    }

    function firstNameOf(fullName) {
        return (fullName || 'there').trim().split(/\s+/)[0];
    }

    function teardownWidget(link) {
        var widget = link.closest('.account-widget');
        if (!widget) { return; }
        widget.parentNode.insertBefore(link, widget);
        widget.remove();
        link.textContent = 'Login / Signup';
        link.setAttribute('href', 'Login.html');
        link.removeAttribute('aria-haspopup');
        link.removeAttribute('aria-expanded');
    }

    function renderAccountWidget() {
        var link = document.getElementById('authBtn');
        if (!link) { return; }

        var user = getUser();

        if (!user) {
            teardownWidget(link);
            return;
        }

        var firstName = firstNameOf(user.name);
        var existingWidget = link.closest('.account-widget');

        if (existingWidget) {
            link.textContent = 'Hi, ' + firstName;
            var nameEl = existingWidget.querySelector('.account-dropdown-name');
            if (nameEl) { nameEl.textContent = user.name; }
            return;
        }

        var wrapper = document.createElement('div');
        wrapper.className = 'account-widget';
        link.parentNode.insertBefore(wrapper, link);
        wrapper.appendChild(link);

        link.setAttribute('href', '#');
        link.textContent = 'Hi, ' + firstName;
        link.setAttribute('aria-haspopup', 'true');
        link.setAttribute('aria-expanded', 'false');

        var panel = document.createElement('div');
        panel.className = 'account-dropdown';
        panel.innerHTML =
            '<div class="account-dropdown-head">Signed in as</div>' +
            '<div class="account-dropdown-name"></div>' +
            '<button type="button" class="btn btn-outline btn-block account-logout">Log Out</button>';
        panel.querySelector('.account-dropdown-name').textContent = user.name;
        wrapper.appendChild(panel);

        link.addEventListener('click', function (e) {
            e.preventDefault();
            var isOpen = wrapper.classList.toggle('is-open');
            link.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        panel.querySelector('.account-logout').addEventListener('click', function () {
            clearUser();
            wrapper.classList.remove('is-open');
            window.location.href = 'index.html';
        });

        document.addEventListener('click', function (e) {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('is-open');
                link.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                wrapper.classList.remove('is-open');
                link.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function wireAuthForms() {
        var loginEmail = document.getElementById('login-email');
        if (loginEmail) {
            var loginForm = loginEmail.closest('form');
            loginForm.addEventListener('submit', function () {
                var email = loginEmail.value;
                var existing = getUser();
                var name = (existing && existing.email === email && existing.name)
                    ? existing.name
                    : nameFromEmail(email);
                setUser({ name: name, email: email });
            });
        }

        var signupName = document.getElementById('signup-name');
        if (signupName) {
            var signupForm = signupName.closest('form');
            signupForm.addEventListener('submit', function () {
                var emailField = document.getElementById('signup-email');
                var name = signupName.value.trim() || 'Guest';
                var email = emailField ? emailField.value : '';
                setUser({ name: name, email: email });
            });
        }
    }

    window.PotsecAuth = {
        getUser: getUser,
        setUser: setUser,
        clearUser: clearUser
    };

    document.addEventListener('DOMContentLoaded', function () {
        renderAccountWidget();
        wireAuthForms();
    });
})();
