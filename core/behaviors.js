import { setTimeout } from 'timers/promises';

export const behaviors = {
  slow: async (page) => {
    console.log('🐢 Mode: Slow Read');
    // Simulate slow reading behavior
    // Scroll down a bit
    await page.mouse.wheel(0, 500);
    // Wait to simulate reading
    await setTimeout(2000);
    // Scroll more
    await page.mouse.wheel(0, 500);
    await setTimeout(2000);
  },
  fast: async (page) => {
    console.log('🐇 Mode: Fast Read');
    // Simulate fast skimming
    for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 1000);
        await setTimeout(500);
    }
  },
  skip: async (page) => {
    console.log('⏩ Mode: Skip');
    // Just scroll to bottom quickly
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await setTimeout(500);
  }
};
