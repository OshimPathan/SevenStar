import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
    page.on('requestfailed', request =>
        console.error('REQUEST FAILED:', request.url(), request.failure().errorText)
    );
    await page.goto('https://34yxw6n9.insforge.site/', { waitUntil: 'networkidle2' });
    await browser.close();
})();
