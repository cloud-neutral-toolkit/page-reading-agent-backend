import { chromium } from 'playwright';
import { behaviors } from './behaviors.js';
import { getGeoProfile } from './profiles.js';

export class ReadingAgent {
    constructor(config = {}) {
        this.url = config.url;
        this.mode = config.mode || 'slow';
        this.device = config.device || 'desktop';
        this.region = config.region || 'JP';
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async start() {
        this.browser = await chromium.launch({ headless: true });

        const profile = getGeoProfile(this.region, this.device);

        this.context = await this.browser.newContext({
            ...profile,
            viewport: this.device === 'mobile' ? profile.viewport : { width: 1280, height: 800 }
        });

        this.page = await this.context.newPage();
    }

    async run() {
        try {
            if (!this.page) await this.start();

            console.log(`Analyzing: ${this.url}`);
            await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });

            const action = behaviors[this.mode];
            if (action) {
                await action(this.page);
            } else {
                console.warn(`Unknown mode: ${this.mode}`);
            }
        } catch (error) {
            console.error('Agent execution failed:', error);
            throw error;
        }
    }

    async cleanUp() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}
