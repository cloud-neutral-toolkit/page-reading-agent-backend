import { chromium } from 'playwright';
import { behaviors } from './core/behaviors.js';
import { getGeoProfile } from './core/profiles.js';
import { auditSEO, generateSEOReport } from './core/seo-audit.js';
import http from 'node:http';

const DEFAULT_CONFIG = {
    url: process.env.TARGET_URL || 'https://www.onwalk.net',
    mode: process.env.MODE || 'slow',
    device: process.env.DEVICE || 'desktop',
    region: process.env.REGION_HINT || 'JP',
    port: process.env.PORT || 8080
};

const server = http.createServer(async (req, res) => {
    // Enable CORS for Dashboard interaction
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Parse Request Body
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            let requestConfig = {};

            // Try parsing JSON body if present
            if (body) {
                try {
                    requestConfig = JSON.parse(body);
                } catch (e) {
                    console.warn('Failed to parse body as JSON', e);
                }
            }

            // Also check query params if it's a GET request or to override
            const url = new URL(req.url, `http://${req.headers.host}`);
            const queryParams = Object.fromEntries(url.searchParams.entries());

            // Merge configs: Defaults -> Query Params -> Body Params
            const currentTaskConfig = {
                ...DEFAULT_CONFIG,
                ...queryParams,
                ...requestConfig
            };

            // Route: SEO Audit
            if (url.pathname === '/seo-audit') {
                console.log(`🔍 Starting SEO Audit for: ${currentTaskConfig.url}`);
                const result = await runSEOAudit(currentTaskConfig);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return;
            }

            // Route: Default Agent
            const result = await runAgent(currentTaskConfig);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (err) {
            console.error(`❌ Error: ${err.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: err.message }));
        }
    });
});

server.listen(DEFAULT_CONFIG.port, () => {
    console.log(`🚀 Server listening on port ${DEFAULT_CONFIG.port}`);
});

async function runAgent(config) {
    console.log(`🚀 Agent Starting Task: ${JSON.stringify(config)}`);

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Critical for containers with low shared memory
            '--disable-gpu',
            '--no-zygote'
        ]
    });

    try {
        // Get profile config based on region and device
        const profile = getGeoProfile(config.region, config.device);

        const context = await browser.newContext({
            ...profile,
            // Ensure viewport is set if not provided by profile (e.g. desktop)
            viewport: profile.viewport || { width: 1280, height: 800 }
        });

        const page = await context.newPage();
        const startTime = Date.now();

        await page.goto(config.url, { waitUntil: 'domcontentloaded' });

        // Execute behavior
        const action = behaviors[config.mode];
        if (action) await action(page);

        const duration = (Date.now() - startTime) / 1000;

        const report = {
            status: 'success',
            url: config.url,
            duration: duration,
            mode: config.mode,
            region: config.region,
            device: config.device
        };

        // Keep the original log format as well for stdout logging
        console.log(`REPORT_JSON: ${JSON.stringify(report)}`);

        return report;

    } finally {
        await browser.close();
    }
}

async function runSEOAudit(config) {
    console.log(`🔍 SEO Audit Starting: ${JSON.stringify(config)}`);

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote'
        ]
    });

    try {
        // Get profile config based on region and device
        const profile = getGeoProfile(config.region, config.device);

        const context = await browser.newContext({
            ...profile,
            viewport: profile.viewport || { width: 1280, height: 800 }
        });

        const page = await context.newPage();
        const startTime = Date.now();

        // Navigate to the page
        await page.goto(config.url, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait a bit for any dynamic content to load
        await page.waitForTimeout(2000);

        // Run SEO audit
        const audit = await auditSEO(page, config.url);
        const report = generateSEOReport(audit);

        // Add metadata
        report.config = {
            region: config.region,
            device: config.device,
            timestamp: new Date().toISOString()
        };

        const duration = (Date.now() - startTime) / 1000;
        report.summary.duration = duration;

        console.log(`✅ SEO Audit Complete: Score ${report.summary.overallScore}/100 in ${duration}s`);
        console.log(`   Critical: ${report.issues.critical}, Warnings: ${report.issues.warnings}, Suggestions: ${report.issues.suggestions}`);

        return report;

    } catch (error) {
        console.error(`❌ SEO Audit Error: ${error.message}`);
        return {
            status: 'error',
            error: error.message,
            url: config.url,
            timestamp: new Date().toISOString()
        };
    } finally {
        await browser.close();
    }
}

