import { chromium } from 'playwright';
import { behaviors } from './core/behaviors.js';
import { getGeoProfile } from './core/profiles.js';
import http from 'node:http';

const CONFIG = {
    url: process.env.TARGET_URL || 'https://mp.weixin.qq.com/s/Wv6uu2txazoDw7XJMQTkGQ',
    mode: process.env.MODE || 'slow',
    device: process.env.DEVICE || 'desktop',
    region: process.env.REGION_HINT || 'JP',
    port: process.env.PORT || 8080
};

const server = http.createServer(async (req, res) => {
    if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        const result = await runAgent();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
    }
});

server.listen(CONFIG.port, () => {
    console.log(`🚀 Server listening on port ${CONFIG.port}`);
});

async function runAgent() {
    console.log(`🚀 Agent Starting: ${JSON.stringify(CONFIG)}`);

    const browser = await chromium.launch({ headless: true });

    try {
        // Get profile config based on region and device
        const profile = getGeoProfile(CONFIG.region, CONFIG.device);

        const context = await browser.newContext({
            ...profile,
            // Ensure viewport is set if not provided by profile (e.g. desktop)
            viewport: profile.viewport || { width: 1280, height: 800 }
        });

        const page = await context.newPage();
        const startTime = Date.now();

        await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded' });

        // Execute behavior
        const action = behaviors[CONFIG.mode];
        if (action) await action(page);

        const duration = (Date.now() - startTime) / 1000;

        const report = {
            status: 'success',
            url: CONFIG.url,
            duration: duration,
            mode: CONFIG.mode,
            region: CONFIG.region,
            device: CONFIG.device
        };

        // Keep the original log format as well for stdout logging
        console.log(`REPORT_JSON: ${JSON.stringify(report)}`);

        return report;

    } finally {
        await browser.close();
    }
}
