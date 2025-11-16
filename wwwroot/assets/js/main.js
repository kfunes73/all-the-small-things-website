// main.js — site interactions (dropdown + gallery equalizer + mobile nav)

document.addEventListener('DOMContentLoaded', () => {

    /* ------------------ Mobile Navigation Toggle ------------------ */
    const navToggle = document.querySelector('.nav-toggle');
    const primaryNav = document.querySelector('.primary-nav');

    if (navToggle && primaryNav) {
        navToggle.addEventListener('click', () => {
            const isNavOpen = navToggle.getAttribute('aria-expanded') === 'true';
            document.body.classList.toggle('nav-open');
            navToggle.setAttribute('aria-expanded', !isNavOpen);
        });

        // Close mobile nav when a link is clicked (for single-page apps or hash links)
        primaryNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                document.body.classList.remove('nav-open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ------------------ Dropdown (supports multiple) ------------------ */
    const dropdowns = document.querySelectorAll('.dropdown');

    // Close any open menus if you click outside
    document.addEventListener('click', (e) => {
        dropdowns.forEach(dd => {
            if (!dd.contains(e.target)) {
                dd.classList.remove('open');
                const toggle = dd.querySelector('.dropdown-toggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    dropdowns.forEach((dd, i) => {
        const toggle = dd.querySelector('.dropdown-toggle');
        const menu = dd.querySelector('.dropdown-menu');
        if (!toggle || !menu) return;

        // ARIA wiring
        const id = menu.id || `nav-dropdown-${i}`;
        menu.id = id;
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-controls', id);
        toggle.setAttribute('aria-expanded', 'false');

        const open = () => { dd.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); };
        const close = () => { dd.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };

        const toggleMenu = (ev) => {
            // Prevent document click handler from closing it immediately
            ev.stopPropagation();
            dd.classList.contains('open') ? close() : open();
        };

        toggle.addEventListener('click', toggleMenu);

        // Keyboard helpers
        toggle.addEventListener('keydown', (ev) => {
            if (ev.key === 'ArrowDown') { ev.preventDefault(); open(); menu.querySelector('a,button,[tabindex]:not([tabindex="-1"])')?.focus(); }
            if (ev.key === 'Escape') { close(); toggle.focus(); }
        });
        menu.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { close(); toggle.focus(); } });
    });

    /* ------------------ Gallery: equalize before/after ------------------ */
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return; // only run this part on the gallery page

    const whenLoaded = (img) =>
        (img.complete && img.naturalWidth > 0)
            ? Promise.resolve()
            : new Promise(res => img.addEventListener('load', res, { once: true }));

    function getColumnCount(fig) {
        const cs = getComputedStyle(fig);
        const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length || 1;
        return cols;
    }

    async function equalizeFigure(fig) {
        const imgs = Array.from(fig.querySelectorAll('img'));
        if (imgs.length < 2) return;

        await Promise.all(imgs.map(whenLoaded));

        // Reset any previous sizing before measurement
        imgs.forEach(img => {
            img.style.height = '';
            img.style.width = '100%';
            img.style.maxWidth = 'none';
            img.style.objectFit = 'contain';
            img.loading = 'lazy';
            img.decoding = 'async';
            if (img.classList.contains('after-img')) img.style.marginLeft = '0';
        });

        const cols = getColumnCount(fig);
        if (cols === 1) return; // If stacked (1 column), let images size naturally

        const cs = getComputedStyle(fig);
        const gap = parseFloat(cs.columnGap || cs.gridColumnGap || '0') || 0;
        const figWidth = fig.clientWidth;
        const colWidth = (figWidth - gap * (cols - 1)) / cols;

        const heights = imgs.map(img => colWidth * (img.naturalHeight / img.naturalWidth));
        const target = Math.max(...heights);
        const px = Math.round(target) + 'px';
        imgs.forEach(img => { img.style.height = px; });
    }

    function equalizeAll() {
        document.querySelectorAll('.gallery-item').forEach(equalizeFigure);
    }

    // Debounced resize and ResizeObserver for efficiency
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(equalizeAll, 150); });

    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) equalizeFigure(entry.target);
        });
        document.querySelectorAll('.gallery-item').forEach(fig => ro.observe(fig));
    }

    // Initial run
    setTimeout(equalizeAll, 0);
});