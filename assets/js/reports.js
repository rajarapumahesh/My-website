// Resource-specific feedback drafts. Sending is handled by the visitor's email app.
(() => {
    const modal = document.getElementById('comment-modal');
    const form = document.getElementById('comment-form');
    const textarea = form.elements.comment;
    const status = document.getElementById('comment-status');
    const emailLink = document.getElementById('comment-email');
    let trigger = null;
    let resource = null;
    const key = () => `portfolio-feedback:${resource.url}`;
    const close = () => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        trigger?.focus();
    };
    const saveDraft = () => {
        try { localStorage.setItem(key(), textarea.value); } catch { /* Storage is optional. */ }
        emailLink.hidden = true;
        status.textContent = '';
    };
    document.querySelectorAll('.comment-btn').forEach(button => button.addEventListener('click', event => {
        event.preventDefault();
        trigger = button;
        const item = button.closest('.item');
        resource = { title: item.querySelector('h3').textContent, url: item.querySelector('a[href^="https:"]').href };
        document.getElementById('comment-context').textContent = resource.title;
        document.getElementById('report-id').value = resource.url;
        status.textContent = ''; emailLink.hidden = true;
        textarea.value = '';
        try { textarea.value = localStorage.getItem(key()) || ''; } catch { /* Start a fresh draft. */ }
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        textarea.focus();
    }));
    modal.querySelector('.close-btn').addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    modal.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key === 'Tab') {
            const focusable = [...modal.querySelectorAll('button, textarea, a[href]')].filter(el => !el.hidden);
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
    textarea.addEventListener('input', saveDraft);
    form.addEventListener('submit', event => {
        event.preventDefault();
        const comment = textarea.value.trim();
        if (!comment) { status.textContent = 'Write your feedback before preparing the email.'; textarea.focus(); return; }
        const subject = `Portfolio feedback: ${resource.title}`;
        const body = `${resource.title}\n${resource.url}\n\n${comment}`;
        emailLink.href = `mailto:rajarapumahesh26@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        emailLink.hidden = false;
        status.textContent = 'Draft ready. Open your email app to review and send it.';
    });
})();
