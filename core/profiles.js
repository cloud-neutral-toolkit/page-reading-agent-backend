import { devices } from 'playwright';

// Standard User Agents (approximations)
const USER_AGENTS = {
    desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
};

const LOCALES = {
    JP: { locale: 'ja-JP', timezone: 'Asia/Tokyo' },
    US: { locale: 'en-US', timezone: 'America/New_York' }
};

export const getGeoProfile = (region, deviceType) => {
    const meta = LOCALES[region] || LOCALES['JP']; // Default to JP
    const deviceConfig = deviceType === 'mobile' ? devices['iPhone 14'] : {};

    return {
        ...deviceConfig,
        locale: meta.locale,
        timezoneId: meta.timezone,
        userAgent: USER_AGENTS[deviceType] || USER_AGENTS['desktop'],
        geolocation: region === 'JP' ? { longitude: 139.6917, latitude: 35.6895 } : { longitude: -74.006, latitude: 40.7128 },
        permissions: ['geolocation']
    };
};
