/* ========================================
   Mashriq (مشرق) - Stripe Client
   ========================================
   
   PURPOSE:
   Handle Stripe API authentication and client creation.
   Uses Replit's connection API for secure credential management.
   
   ======================================== */

const Stripe = require('stripe');

let connectionSettings = null;

/**
 * Fetch Stripe credentials from Replit connection API
 * @returns {Promise<{publishableKey: string, secretKey: string}>}
 */
async function getCredentials() {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
        ? 'repl ' + process.env.REPL_IDENTITY
        : process.env.WEB_REPL_RENEWAL
            ? 'depl ' + process.env.WEB_REPL_RENEWAL
            : null;

    if (!xReplitToken) {
        throw new Error('X_REPLIT_TOKEN not found for repl/depl');
    }

    const connectorName = 'stripe';
    const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
    const targetEnvironment = isProduction ? 'production' : 'development';

    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set('include_secrets', 'true');
    url.searchParams.set('connector_names', connectorName);
    url.searchParams.set('environment', targetEnvironment);

    const response = await fetch(url.toString(), {
        headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
        }
    });

    const data = await response.json();
    connectionSettings = data.items?.[0];

    if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
        throw new Error(`Stripe ${targetEnvironment} connection not found`);
    }

    return {
        publishableKey: connectionSettings.settings.publishable,
        secretKey: connectionSettings.settings.secret,
    };
}

/**
 * Get a fresh Stripe client instance
 * WARNING: Never cache this client - always call this function again
 * @returns {Promise<Stripe>}
 */
async function getStripeClient() {
    const { secretKey } = await getCredentials();
    return new Stripe(secretKey, {
        apiVersion: '2023-10-16',
    });
}

/**
 * Get Stripe publishable key for client-side
 * @returns {Promise<string>}
 */
async function getStripePublishableKey() {
    const { publishableKey } = await getCredentials();
    return publishableKey;
}

/**
 * Get Stripe secret key for server-side operations
 * @returns {Promise<string>}
 */
async function getStripeSecretKey() {
    const { secretKey } = await getCredentials();
    return secretKey;
}

module.exports = {
    getStripeClient,
    getStripePublishableKey,
    getStripeSecretKey
};
