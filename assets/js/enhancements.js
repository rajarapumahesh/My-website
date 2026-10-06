// Shared behavior for additions to the original portfolio design.
(() => {
    document.documentElement.dataset.enhanced = 'true';
    const toggle = document.querySelector('.nav-toggle');
    const navigation = document.getElementById('site-navigation');
    const closeNavigation = () => {
        navigation.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    };
    toggle?.addEventListener('click', () => {
        const open = navigation.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && navigation?.classList.contains('is-open')) {
            closeNavigation(); toggle.focus();
        }
    });
    document.addEventListener('click', event => {
        if (navigation && !navigation.contains(event.target) && !toggle.contains(event.target)) closeNavigation();
    });
    document.querySelector('[data-year]').textContent = String(new Date().getFullYear());

    document.querySelectorAll('[data-library]').forEach(library => {
        const controls = library.querySelector('[data-filter-controls]');
        const search = controls.querySelector('[data-library-search]');
        const buttons = [...controls.querySelectorAll('[data-filter]')];
        const items = [...library.querySelectorAll('[data-library-item]')];
        let category = 'all';
        const applyFilter = () => {
            const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
            let visible = 0;
            items.forEach(item => {
                const text = item.textContent.toLocaleLowerCase();
                item.hidden = !(category === 'all' || item.dataset.category === category) || !words.every(word => text.includes(word));
                if (!item.hidden) visible++;
            });
            controls.querySelector('[data-library-count]').textContent = `${visible} of ${items.length} shown`;
            library.querySelector('[data-library-empty]').hidden = visible > 0;
            library.querySelectorAll('[data-library-section]').forEach(section => {
                section.hidden = ![...section.querySelectorAll('[data-library-item]')].some(item => !item.hidden);
            });
        };
        search.addEventListener('input', applyFilter);
        buttons.forEach(button => button.addEventListener('click', () => {
            category = button.dataset.filter;
            buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
            applyFilter();
        }));
        controls.hidden = false;
        applyFilter();
    });

    document.querySelectorAll('[data-copy-citation]').forEach(button => button.addEventListener('click', async () => {
        const card = button.closest('.publication-card');
        const reference = `${card.querySelector('.card-meta').textContent}. ${card.querySelector('h4').textContent}. ${card.querySelector('.venue').textContent}. ${card.querySelector('.status').textContent}.`;
        const status = document.querySelector('[data-copy-status]');
        try {
            await navigator.clipboard.writeText(reference);
            status.textContent = 'Reference copied, including its current publication status.';
            button.textContent = 'Copied ✓';
            setTimeout(() => { button.textContent = 'Copy reference'; }, 2000);
        } catch {
            status.textContent = 'Select the reference text on the card to copy it. Clipboard access is unavailable.';
        }
    }));
    document.querySelectorAll('.pdf-preview').forEach(details => details.addEventListener('toggle', () => {
        const frame = details.querySelector('iframe');
        if (details.open && !frame.hasAttribute('src')) frame.src = frame.dataset.pdfSrc;
    }));
})();
