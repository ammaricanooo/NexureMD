/**
 * API Key Middleware
 * Validasi dan manage API Key dari database
 */

import ApiKey, { verifyApiKey } from '../databases/orm/ApiKey.js';

/**
 * Validasi API Key dari header atau query params
 * @param {string} providedKey - API Key dari request
 * @returns {Promise<{valid: boolean, apiKey?: Object, error?: string}>}
 */
export async function validateApiKeyFromDb(providedKey) {
    try {
        if (!providedKey) {
            return {
                valid: false,
                error: 'API Key diperlukan'
            };
        }

        // Cari API Key di database berdasarkan prefix
        const apiKeys = await ApiKey.findAll({
            where: { is_active: true },
            raw: true
        });

        // Cek setiap key
        for (const dbKey of apiKeys) {
            if (verifyApiKey(providedKey, dbKey.key)) {
                // Update last_used dan request_count
                await ApiKey.update(
                    {
                        last_used: new Date(),
                        request_count: dbKey.request_count + 1
                    },
                    { where: { id: dbKey.id } }
                );

                return {
                    valid: true,
                    apiKey: dbKey
                };
            }
        }

        return {
            valid: false,
            error: 'API Key tidak valid atau sudah dinonaktifkan'
        };
    } catch (error) {
        return {
            valid: false,
            error: `Error validasi key: ${error.message}`
        };
    }
}

/**
 * Express Middleware untuk API Key validation
 */
export function apiKeyMiddleware() {
    return async (req, res, next) => {
        const apiKey = req.headers['x-api-key'] || req.query.apikey;

        const validation = await validateApiKeyFromDb(apiKey);

        if (!validation.valid) {
            return res.status(401).json({
                success: false,
                error: validation.error || 'Unauthorized'
            });
        }

        // Attach apiKey info ke request
        req.apiKey = validation.apiKey;
        next();
    };
}

export default {
    validateApiKeyFromDb,
    apiKeyMiddleware
};
