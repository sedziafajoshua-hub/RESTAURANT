/* =========================================================
   POTSEC CATERING FOODS — page transition helper
   Fades the current page out just before navigating to another
   page on the site, so clicking a nav link or filter pill feels
   like one smooth motion rather than an abrupt page swap. The
   destination page's own entrance animation (see theme.css)
   completes the effect on arrival.
   ========================================================= */
(function () {
    var LEAVE_DELAY = 170;

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0) { return; }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }

        var link = e.target.closest('a');
        if (!link) { return; }
        if (link.target && link.target !== '_self') { return; }
        if (link.hasAttribute('download')) { return; }

        var href = link.getAttribute('href') || '';
        if (!href || href.charAt(0) === '#') { return; }
        if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) { return; }

        var url;
        try {
            url = new URL(href, window.location.href);
        } catch (err) {
            return;
        }
        if (url.origin !== window.location.origin) { return; }
        if (url.pathname === window.location.pathname && url.search === window.location.search) { return; }

        e.preventDefault();
        document.body.classList.add('page-leaving');
        window.setTimeout(function () {
            window.location.href = url.href;
        }, LEAVE_DELAY);
    });
})();
