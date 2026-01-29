/**
 * SEO Audit Module
 * 
 * Performs comprehensive SEO analysis on web pages including:
 * - Meta tags validation
 * - Heading structure
 * - Image alt text
 * - Internal/external links
 * - Structured data
 * - Performance metrics
 * - Mobile responsiveness
 */

export async function auditSEO(page, url) {
    const startTime = Date.now();

    const audit = {
        url,
        timestamp: new Date().toISOString(),
        scores: {},
        issues: {
            critical: [],
            warnings: [],
            suggestions: []
        },
        metadata: {},
        performance: {},
        accessibility: {}
    };

    try {
        // 1. Meta Tags Analysis
        audit.metadata = await analyzeMetaTags(page);

        // 2. Heading Structure
        audit.headingStructure = await analyzeHeadings(page);

        // 3. Images Analysis
        audit.images = await analyzeImages(page);

        // 4. Links Analysis
        audit.links = await analyzeLinks(page, url);

        // 5. Structured Data
        audit.structuredData = await analyzeStructuredData(page);

        // 6. Performance Metrics
        audit.performance = await analyzePerformance(page);

        // 7. Mobile Responsiveness
        audit.mobile = await analyzeMobileReadiness(page);

        // 8. Content Analysis
        audit.content = await analyzeContent(page);

        // Calculate overall score
        audit.scores = calculateScores(audit);

        // Categorize issues
        categorizeIssues(audit);

        audit.duration = (Date.now() - startTime) / 1000;

        return audit;

    } catch (error) {
        audit.error = error.message;
        audit.status = 'failed';
        return audit;
    }
}

async function analyzeMetaTags(page) {
    const meta = await page.evaluate(() => {
        const getMetaContent = (name) => {
            const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            return meta ? meta.getAttribute('content') : null;
        };

        return {
            title: document.title || null,
            titleLength: document.title ? document.title.length : 0,
            description: getMetaContent('description'),
            descriptionLength: getMetaContent('description')?.length || 0,
            keywords: getMetaContent('keywords'),
            robots: getMetaContent('robots'),
            canonical: document.querySelector('link[rel="canonical"]')?.href || null,

            // Open Graph
            ogTitle: getMetaContent('og:title'),
            ogDescription: getMetaContent('og:description'),
            ogImage: getMetaContent('og:image'),
            ogUrl: getMetaContent('og:url'),
            ogType: getMetaContent('og:type'),

            // Twitter Card
            twitterCard: getMetaContent('twitter:card'),
            twitterTitle: getMetaContent('twitter:title'),
            twitterDescription: getMetaContent('twitter:description'),
            twitterImage: getMetaContent('twitter:image'),

            // Viewport
            viewport: getMetaContent('viewport'),

            // Language
            lang: document.documentElement.lang || null,
        };
    });

    return meta;
}

async function analyzeHeadings(page) {
    return await page.evaluate(() => {
        const headings = {
            h1: [],
            h2: [],
            h3: [],
            h4: [],
            h5: [],
            h6: [],
            structure: []
        };

        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            const elements = document.querySelectorAll(tag);
            headings[tag] = Array.from(elements).map(el => ({
                text: el.textContent.trim(),
                length: el.textContent.trim().length
            }));
        });

        // Build hierarchy
        const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.structure = Array.from(allHeadings).map(h => ({
            level: parseInt(h.tagName.substring(1)),
            text: h.textContent.trim().substring(0, 100)
        }));

        return headings;
    });
}

async function analyzeImages(page) {
    return await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));

        return {
            total: images.length,
            withAlt: images.filter(img => img.alt && img.alt.trim()).length,
            withoutAlt: images.filter(img => !img.alt || !img.alt.trim()).length,
            missingAlt: images
                .filter(img => !img.alt || !img.alt.trim())
                .map(img => ({
                    src: img.src,
                    width: img.width,
                    height: img.height
                }))
                .slice(0, 20) // Limit to first 20
        };
    });
}

async function analyzeLinks(page, baseUrl) {
    return await page.evaluate((base) => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        const baseHost = new URL(base).hostname;

        const analysis = {
            total: links.length,
            internal: 0,
            external: 0,
            broken: [],
            nofollow: 0,
            deadLinks: []
        };

        links.forEach(link => {
            const href = link.href;

            // Check for dead links
            if (href === '#' || href === 'javascript:void(0)' || href === '') {
                analysis.deadLinks.push({
                    text: link.textContent.trim().substring(0, 50),
                    href: href
                });
            }

            // Check if internal or external
            try {
                const linkHost = new URL(href).hostname;
                if (linkHost === baseHost) {
                    analysis.internal++;
                } else {
                    analysis.external++;
                }
            } catch (e) {
                // Relative link or invalid URL
                analysis.internal++;
            }

            // Check for nofollow
            if (link.rel && link.rel.includes('nofollow')) {
                analysis.nofollow++;
            }
        });

        return analysis;
    }, baseUrl);
}

async function analyzeStructuredData(page) {
    return await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

        const data = {
            found: scripts.length > 0,
            count: scripts.length,
            types: []
        };

        scripts.forEach(script => {
            try {
                const json = JSON.parse(script.textContent);
                if (json['@type']) {
                    data.types.push(json['@type']);
                }
            } catch (e) {
                // Invalid JSON
            }
        });

        return data;
    });
}

async function analyzePerformance(page) {
    return await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];

        return {
            domContentLoaded: perf?.domContentLoadedEventEnd - perf?.domContentLoadedEventStart || 0,
            loadComplete: perf?.loadEventEnd - perf?.loadEventStart || 0,
            domInteractive: perf?.domInteractive || 0,
            resourceCount: performance.getEntriesByType('resource').length
        };
    });
}

async function analyzeMobileReadiness(page) {
    return await page.evaluate(() => {
        return {
            hasViewport: !!document.querySelector('meta[name="viewport"]'),
            viewportContent: document.querySelector('meta[name="viewport"]')?.content || null,
            hasResponsiveImages: document.querySelectorAll('img[srcset]').length > 0,
            hasTouchIcons: document.querySelectorAll('link[rel*="icon"]').length > 0
        };
    });
}

async function analyzeContent(page) {
    return await page.evaluate(() => {
        const text = document.body.innerText;
        const words = text.trim().split(/\s+/).length;

        return {
            wordCount: words,
            characterCount: text.length,
            paragraphs: document.querySelectorAll('p').length,
            readingTime: Math.ceil(words / 200) // Average reading speed
        };
    });
}

function calculateScores(audit) {
    const scores = {
        metadata: 0,
        headings: 0,
        images: 0,
        links: 0,
        structuredData: 0,
        performance: 0,
        mobile: 0,
        overall: 0
    };

    // Metadata score (0-100)
    let metaScore = 0;
    if (audit.metadata.title && audit.metadata.titleLength >= 30 && audit.metadata.titleLength <= 60) metaScore += 20;
    if (audit.metadata.description && audit.metadata.descriptionLength >= 120 && audit.metadata.descriptionLength <= 160) metaScore += 20;
    if (audit.metadata.ogTitle) metaScore += 15;
    if (audit.metadata.ogDescription) metaScore += 15;
    if (audit.metadata.ogImage) metaScore += 15;
    if (audit.metadata.canonical) metaScore += 15;
    scores.metadata = metaScore;

    // Headings score
    let headingScore = 0;
    if (audit.headingStructure.h1.length === 1) headingScore += 50;
    if (audit.headingStructure.h2.length > 0) headingScore += 25;
    if (audit.headingStructure.h3.length > 0) headingScore += 25;
    scores.headings = headingScore;

    // Images score
    const imageScore = audit.images.total > 0
        ? (audit.images.withAlt / audit.images.total) * 100
        : 100;
    scores.images = Math.round(imageScore);

    // Links score
    let linkScore = 100;
    if (audit.links.deadLinks.length > 0) linkScore -= Math.min(audit.links.deadLinks.length * 10, 50);
    scores.links = Math.max(linkScore, 0);

    // Structured data score
    scores.structuredData = audit.structuredData.found ? 100 : 0;

    // Mobile score
    let mobileScore = 0;
    if (audit.mobile.hasViewport) mobileScore += 50;
    if (audit.mobile.hasResponsiveImages) mobileScore += 25;
    if (audit.mobile.hasTouchIcons) mobileScore += 25;
    scores.mobile = mobileScore;

    // Overall score (weighted average)
    scores.overall = Math.round(
        (scores.metadata * 0.25) +
        (scores.headings * 0.15) +
        (scores.images * 0.15) +
        (scores.links * 0.20) +
        (scores.structuredData * 0.10) +
        (scores.mobile * 0.15)
    );

    return scores;
}

function categorizeIssues(audit) {
    // Critical issues
    if (!audit.metadata.title) {
        audit.issues.critical.push({ type: 'missing_title', message: 'Missing page title' });
    }
    if (!audit.metadata.description) {
        audit.issues.critical.push({ type: 'missing_description', message: 'Missing meta description' });
    }
    if (audit.headingStructure.h1.length === 0) {
        audit.issues.critical.push({ type: 'missing_h1', message: 'Missing H1 heading' });
    }
    if (audit.headingStructure.h1.length > 1) {
        audit.issues.critical.push({ type: 'multiple_h1', message: `Multiple H1 headings found (${audit.headingStructure.h1.length})` });
    }

    // Warnings
    if (audit.metadata.titleLength > 60) {
        audit.issues.warnings.push({ type: 'title_too_long', message: `Title is too long (${audit.metadata.titleLength} chars, recommended: 30-60)` });
    }
    if (audit.metadata.descriptionLength > 160) {
        audit.issues.warnings.push({ type: 'description_too_long', message: `Description is too long (${audit.metadata.descriptionLength} chars, recommended: 120-160)` });
    }
    if (audit.images.withoutAlt > 0) {
        audit.issues.warnings.push({ type: 'missing_alt_text', message: `${audit.images.withoutAlt} images missing alt text` });
    }
    if (audit.links.deadLinks.length > 0) {
        audit.issues.warnings.push({ type: 'dead_links', message: `${audit.links.deadLinks.length} dead links found (href="#" or empty)` });
    }

    // Suggestions
    if (!audit.metadata.ogImage) {
        audit.issues.suggestions.push({ type: 'missing_og_image', message: 'Add Open Graph image for better social sharing' });
    }
    if (!audit.structuredData.found) {
        audit.issues.suggestions.push({ type: 'missing_structured_data', message: 'Add JSON-LD structured data for rich snippets' });
    }
    if (!audit.mobile.hasViewport) {
        audit.issues.suggestions.push({ type: 'missing_viewport', message: 'Add viewport meta tag for mobile responsiveness' });
    }
    if (!audit.metadata.canonical) {
        audit.issues.suggestions.push({ type: 'missing_canonical', message: 'Add canonical URL to prevent duplicate content issues' });
    }
}

export function generateSEOReport(audit) {
    const report = {
        summary: {
            url: audit.url,
            timestamp: audit.timestamp,
            overallScore: audit.scores.overall,
            duration: audit.duration,
            status: audit.scores.overall >= 80 ? 'excellent' :
                audit.scores.overall >= 60 ? 'good' :
                    audit.scores.overall >= 40 ? 'needs_improvement' : 'poor'
        },
        scores: audit.scores,
        issues: {
            critical: audit.issues.critical.length,
            warnings: audit.issues.warnings.length,
            suggestions: audit.issues.suggestions.length,
            details: audit.issues
        },
        details: {
            metadata: audit.metadata,
            headings: audit.headingStructure,
            images: audit.images,
            links: audit.links,
            structuredData: audit.structuredData,
            performance: audit.performance,
            mobile: audit.mobile,
            content: audit.content
        }
    };

    return report;
}
