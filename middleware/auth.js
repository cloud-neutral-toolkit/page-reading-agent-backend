/**
 * Internal Service Authentication Middleware
 * Validates X-Service-Token header against INTERNAL_SERVICE_TOKEN environment variable
 */

export function createInternalAuthMiddleware() {
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

    return function internalAuthMiddleware(req, res, next) {
        const serviceToken = req.headers['x-service-token'];

        if (!serviceToken) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'missing service token' }));
            return;
        }

        if (!expectedToken) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'internal service token not configured' }));
            return;
        }

        if (serviceToken !== expectedToken) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'invalid service token' }));
            return;
        }

        // Token is valid, continue to next handler
        next();
    };
}
