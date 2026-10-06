// Run with the static preview on :8000 and Wrangler's local Worker on :8787.
const {chromium, expect} = require('@playwright/test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');

(async () => {
    const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    try {
        const a = await browser.newContext(); const b = await browser.newContext();
        const first = await a.newPage(); const second = await b.newPage();
        await first.goto('http://localhost:8000/');
        await expect(first.locator('#like-button')).toBeEnabled();
        const start = Number(await first.locator('#like-count').textContent());
        await first.locator('#like-button').click();
        await expect(first.locator('#like-button')).toHaveAttribute('aria-pressed','true');
        assert.equal(Number(await first.locator('#like-count').textContent()), start+1);
        await first.reload();
        await expect(first.locator('#like-button')).toHaveAttribute('aria-pressed','true');
        assert.equal(Number(await first.locator('#like-count').textContent()), start+1);
        await first.locator('#like-button').click();
        assert.equal(Number(await first.locator('#like-count').textContent()), start+1);

        await second.goto('http://localhost:8000/');
        await expect(second.locator('#like-button')).toBeEnabled();
        assert.equal(Number(await second.locator('#like-count').textContent()), start+1);
        await second.locator('#like-button').click();
        await expect(second.locator('#like-button')).toHaveAttribute('aria-pressed','true');
        assert.equal(Number(await second.locator('#like-count').textContent()), start+2);
        await first.reload();
        await expect(first.locator('#like-count')).toHaveText(String(start+2));

        const url = 'http://127.0.0.1:8787/api/likes';
        const visitorId = randomUUID();
        const replies = await Promise.all(Array.from({length:20}, () => first.request.post(url,{headers:{Origin:'http://localhost:8000'},data:{visitorId}})));
        assert(replies.every(r => r.ok()));
        const total = await (await first.request.get(url)).json();
        assert.equal(total.count,start+3,'Concurrent duplicate writes add one row');
        assert.equal((await first.request.post(url,{headers:{Origin:'https://not-allowed.example'},data:{visitorId:randomUUID()}})).status(),403);
        assert.equal((await first.request.post(url,{headers:{Origin:'http://localhost:8000'},data:{visitorId:'invalid'}})).status(),400);

        // A server-accepted write whose response is lost must not be added again on retry.
        const c = await browser.newContext(); const third = await c.newPage();
        await third.goto('http://localhost:8000/');
        await expect(third.locator('#like-button')).toBeEnabled();
        await third.route('**/api/likes', async route => {
            if (route.request().method() === 'POST') {
                await route.fetch(); await route.abort('failed');
            } else await route.continue();
        });
        await third.locator('#like-button').click();
        await expect(third.locator('#like-status')).toContainText('Could not save');
        assert.equal(Number(await third.locator('#like-count').textContent()), start+3,'No pretend increment after network failure');
        await third.unroute('**/api/likes');
        await third.locator('#like-button').click();
        await expect(third.locator('#like-button')).toHaveAttribute('aria-pressed','true');
        assert.equal(Number(await third.locator('#like-count').textContent()),start+4,'Retry counted only once');
        await c.close(); await a.close(); await b.close();
        console.log('PASS: real local Worker/SQLite; shared totals across browsers; saved state after reload; simultaneous/retried writes; origin validation; failed-write UX.');
    } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
