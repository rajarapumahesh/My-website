// Shared likes use an atomic backend. Empty configuration uses an explicitly local preview.
(() => {
    const countElement = document.getElementById('like-count');
    const button = document.getElementById('like-button');
    const status = document.getElementById('like-status');
    const config = window.PORTFOLIO_LIKES || {};
    const localPreview = !config.endpoint && ['localhost', '127.0.0.1'].includes(location.hostname) && Boolean(config.localPreviewEndpoint);
    const endpoint = config.endpoint?.trim() || (localPreview ? config.localPreviewEndpoint : '') || '';
    const shared = Boolean(endpoint);
    const keys = { visitor: 'portfolio-visitor-id', localLiked: 'portfolio-local-liked' };
    const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
    const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ } };
    let visitorId = read(keys.visitor);
    if (!visitorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
        visitorId = crypto.randomUUID(); write(keys.visitor, visitorId);
    }
    let count = 0;
    let liked = false;
    let busy = false;
    let available = !shared;
    let latestRefresh = 0;

    const render = () => {
        countElement.textContent = available ? String(count) : '—';
        button.disabled = busy || (shared && !available);
        button.setAttribute('aria-pressed', String(liked));
        button.setAttribute('aria-label', liked ? 'Thank you — your heart is already saved' : 'Send a heart to this portfolio');
        button.title = liked ? 'One heart per browser — yours is saved' : 'Send a heart';
    };
    const request = async (method = 'GET') => {
        const url = new URL(endpoint, location.href);
        if (method === 'GET') url.searchParams.set('visitorId', visitorId);
        const response = await fetch(url, {
            method, cache: 'no-store', signal: AbortSignal.timeout(8000),
            ...(method === 'POST' ? {headers: {'Content-Type':'application/json'},body:JSON.stringify({visitorId})} : {}),
        });
        if (!response.ok) throw new Error('Counter unavailable');
        const data = await response.json();
        if (!Number.isSafeInteger(data.count) || data.count < 0 || typeof data.liked !== 'boolean') throw new Error('Invalid counter response');
        return data;
    };
    const refresh = async () => {
        if (!shared || busy || document.hidden) return;
        busy = true; render();
        try {
            const result = await request();
            count = result.count; liked = result.liked; available = true;
            status.textContent = localPreview ? 'Local shared preview · hearts saved' : (liked ? 'Thank you for your heart!' : 'Hearts from portfolio visitors');
        } catch {
            status.textContent = 'Hearts are temporarily unavailable. Please try again shortly.';
        } finally { busy = false; latestRefresh = Date.now(); render(); }
    };
    if (!shared) {
        const stored = Number.parseInt(read('likeCount'), 10);
        count = Number.isSafeInteger(stored) && stored >= 0 ? stored : 0;
        liked = read(keys.localLiked) === 'true';
        status.textContent = 'Local preview · saved in this browser';
    }
    render(); refresh();
    button.addEventListener('click', async () => {
        if (busy || liked) return;
        busy = true; render();
        try {
            if (shared) {
                const result = await request('POST');
                if (!result.liked) throw new Error('Heart was not saved');
                count = result.count; liked = true; available = true;
                status.textContent = localPreview ? 'Heart saved · local shared preview' : 'Thank you! Your heart is saved.';
            } else {
                count += 1; liked = true;
                write('likeCount', String(count)); write(keys.localLiked, 'true');
                status.textContent = 'Heart saved in this browser · local preview';
            }
            button.classList.remove('is-celebrating');
            void button.offsetWidth;
            button.classList.add('is-celebrating');
        } catch {
            status.textContent = 'Could not save your heart. Please try again.';
        } finally { busy = false; render(); }
    });
    button.addEventListener('animationend', () => button.classList.remove('is-celebrating'));
    if (shared) {
        setInterval(refresh, 30000);
        addEventListener('focus', () => { if (Date.now() - latestRefresh > 5000) refresh(); });
        document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - latestRefresh > 5000) refresh(); });
    }
})();
