// Optional browser checks. Preview with python -m http.server 8000 first.
const { chromium } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
    const root = path.resolve(__dirname, '..');
    const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    try {
        const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        const pages = ['index.html', 'About.html', 'Publications.html', 'Projects.html', 'Reports.html', 'Resume.html', 'Talks.html'];
        for (const width of [1903, 1440, 768, 390, 320]) {
            await page.setViewportSize({ width, height: 1000 });
            for (const name of pages) {
                await page.goto(`http://localhost:8000/${name}`);
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal overflow at ${width}`);
                assert.equal(await page.locator('#main').count(), 1, `${name}: main landmark`);
                assert.equal(await page.locator('#site-navigation a').count(), 7, `${name}: navigation`);
                assert.equal(await page.locator('[aria-current=page]').count(), 1, `${name}: active page`);
                if (width === 1903) {
                    for (const url of await page.locator('a[href],link[rel=stylesheet],script[src],img[src]').evaluateAll(els => els.map(el => el.getAttribute('href') || el.getAttribute('src')).filter(url => url && !/^(https?:|mailto:|tel:|#)/.test(url)))) {
                        assert((await page.request.get(`http://localhost:8000/${encodeURI(url)}`)).ok(), `${name}: missing local target ${url}`);
                    }
                }
            }
        }
        await page.goto('http://localhost:8000/Publications.html');
        assert.equal(await page.locator('[data-library-item]').count(), 8);
        await page.getByRole('button', { name: 'Accepted', exact: true }).click();
        assert.equal(await page.locator('[data-library-item]:visible').count(), 2);
        await page.getByRole('button', { name: 'Submitted / under review' }).click();
        assert.equal(await page.locator('[data-library-item]:visible').count(), 5);
        await page.getByRole('button', { name: 'All work' }).click();
        await page.locator('[data-library-search]').fill('PrivView');
        assert.equal(await page.locator('[data-library-item]:visible').count(), 1);
        await page.getByRole('button', { name: 'Copy reference' }).filter({visible:true}).first().click();
        assert((await page.evaluate(() => navigator.clipboard.readText())).includes('Submitted; under review'));
        await page.goto('http://localhost:8000/Projects.html');
        assert.equal(await page.locator('[data-library-item]').count(), 11);
        await page.getByRole('button', { name: 'Document AI', exact: true }).click();
        assert.equal(await page.locator('[data-library-item]:visible').count(), 3);
        await page.locator('[data-library-search]').fill('no-such-project');
        assert(await page.locator('[data-library-empty]').isVisible());
        await page.goto('http://localhost:8000/Reports.html');
        await page.locator('[data-library-search]').fill('probability');
        assert.equal(await page.locator('[data-library-item]:visible').count(), 1);
        await page.locator('.comment-btn:visible').click();
        await page.locator('[name=comment]').fill('Useful probability notes.');
        await page.getByRole('button', { name: 'Prepare email' }).click();
        const draft = await page.locator('#comment-email').getAttribute('href');
        assert(draft.startsWith('mailto:rajarapumahesh26@gmail.com?'));
        assert(decodeURIComponent(draft).includes('Useful probability notes.'));
        await page.keyboard.press('Escape');
        assert(!(await page.locator('#comment-modal').isVisible()));
        await page.locator('.comment-btn:visible').click();
        assert.equal(await page.locator('[name=comment]').inputValue(), 'Useful probability notes.');
        await page.getByRole('button', { name: 'Close comment dialog' }).click();
        await page.goto('http://localhost:8000/Resume.html');
        assert.equal(await page.locator('.pdf-preview iframe').getAttribute('src'), null);
        await page.locator('.pdf-preview summary').click();
        await page.locator('iframe[src]').waitFor();
        assert((await page.locator('iframe').getAttribute('src')).includes('assets/documents/Mahesh_CV.pdf'));
        const pdf = await page.request.get('http://localhost:8000/assets/documents/Mahesh_CV.pdf');
        assert.equal((await pdf.body()).subarray(0, 4).toString(), '%PDF');
        await page.locator('.nav-toggle').click();
        assert(await page.locator('#site-navigation').isVisible());
        await page.keyboard.press('Escape');
        assert(!(await page.locator('#site-navigation').isVisible()));
        await page.goto('http://localhost:8000/index.html');
        assert.equal(await page.locator('#like-button, #like-count, #like-status').count(), 0);

        const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: {width:390,height:900} });
        const noJsPage = await noJsContext.newPage();
        await noJsPage.goto('http://localhost:8000/Publications.html');
        assert.equal(await noJsPage.locator('[data-library-item]:visible').count(), 8);
        assert(await noJsPage.locator('#site-navigation').isVisible());
        await noJsPage.goto('http://localhost:8000/Projects.html');
        assert.equal(await noJsPage.locator('[data-library-item]:visible').count(), 11);
        await noJsContext.close();

        // Confirm the core palette, typography, and banner remain those of the original.
        const original = execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\','/')}`, 'show', 'ebb0e4741f6febe95defc3be272083b5f735bc86:index.html'], {cwd: root, encoding:'utf8'});
        await page.route('**/index.html?original=1', route => route.fulfill({contentType:'text/html',body:original}));
        await page.setViewportSize({width:1903,height:1000});
        const identity = () => page.evaluate(() => Object.fromEntries(['body','.sidebar','.landscape-frame','.quote-text','.quote-author','.social-bar .logo-title','.contact-info a'].map(selector => {
            const style = getComputedStyle(document.querySelector(selector));
            return [selector, [style.backgroundColor,style.color,style.fontFamily,style.fontSize,style.borderTopColor]];
        })));
        await page.goto('http://localhost:8000/index.html?original=1');
        const baseline = await identity();
        await page.goto('http://localhost:8000/index.html');
        assert.deepEqual(await identity(), baseline, 'Original theme identity');
        fs.mkdirSync(path.join(root,'artifacts'), {recursive:true});
        for (const width of [1440,390]) {
            await page.setViewportSize({width,height:1000});
            for (const name of ['index.html','Publications.html','Projects.html']) {
                await page.goto(`http://localhost:8000/${name}`);
                await page.screenshot({path:path.join(root,'artifacts',`${name.replace('.html','')}-${width}.png`),fullPage:true,animations:'disabled'});
            }
        }
        assert.deepEqual(errors, []);
        console.log('PASS: 7 pages at 5 widths; original visual identity; local links; CV; filters; reference copy; feedback drafts; PDF preview; mobile menu; no likes UI; no-JavaScript content/navigation; no JS errors.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
