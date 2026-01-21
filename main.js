import { chromium } from 'playwright';
import { behaviors } from './core/behaviors.js';
import { getGeoProfile } from './core/profiles.js';

const CONFIG = {
    url: process.env.TARGET_URL || 'https://www.onwalk.net',
    mode: process.env.MODE || 'slow',
    device: process.env.DEVICE || 'desktop',
    region: process.env.REGION_HINT || 'JP'
};

(async () => {
    console.log(`🚀 Agent Starting: ${JSON.stringify(CONFIG)}`);

    const browser = await chromium.launch({ headless: true });

    // Get profile config based on region and device
    const profile = getGeoProfile(CONFIG.region, CONFIG.device);

    const context = await browser.newContext({
        ...profile,
        // Ensure viewport is set if not provided by profile (e.g. desktop)
        viewport: profile.viewport || { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    try {
        const startTime = Date.now();
        await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded' });

        // Execute behavior
        const action = behaviors[CONFIG.mode];
        if (action) await action(page);

        const duration = (Date.now() - startTime) / 1000;

        // Output standardized JSON
        console.log(`REPORT_JSON: ${JSON.stringify({
            status: 'success',
            url: CONFIG.url,
            duration: duration,
            mode: CONFIG.mode,
            region: CONFIG.region,
            device: CONFIG.device
        })}`);

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
