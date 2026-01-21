import { chromium } from 'playwright';

(async () => {
    console.log('Starting direct debug test...');
    try {
        const browser = await chromium.launch({ headless: true });
        console.log('Browser launched');
        const page = await browser.newPage();
        console.log('Page created');
        await page.goto('https://mp.weixin.qq.com/s/Wv6uu2txazoDw7XJMQTkGQ');
        console.log('Page loaded: ' + await page.title());
        await browser.close();
        console.log('Browser closed, success');
    } catch (e) {
        console.error('Debug failed:', e);
    }
})();
