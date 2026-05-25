/**
 * WhatsApp Gateway API
 * REST API untuk mengirim pesan WhatsApp langsung via Bot
 * Tanpa perantara Fonnte atau service lainnya
 * 
 * Endpoints:
 * - POST /api/whatsapp/send-text
 * - POST /api/whatsapp/send-bulk
 * - GET /api/whatsapp/status
 * 
 * Semua request harus include header:
 * x-api-key: <your-secret-key>
 */

import express from 'express';
import {
    sendTextMessage,
    sendTextMessageBulk,
    sendMediaMessage,
    sendButtonMessage,
    sendListMessage,
    isValidPhoneNumber,
    formatPhonetoJid
} from '../libs/whatsapp-api.js';
import { isSocketReady } from '../libs/socket-manager.js';
import { apiKeyMiddleware } from '../middlewares/api-key-validation.js';

const router = express.Router();

// ============================================
// MIDDLEWARE: API Key Validation (from Database)
// ============================================

// Apply API key check ke semua routes menggunakan database
router.use(apiKeyMiddleware());

// ============================================
// 1. SEND TEXT MESSAGE (Single)
// ============================================
/**
 * POST /api/whatsapp/send-text
 * 
 * Body:
 * {
 *   "phone": "6281234567890",
 *   "message": "Halo, ini pesan test!"
 * }
 */
router.post('/send-text', async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'phone dan message diperlukan'
            });
        }

        if (!isValidPhoneNumber(phone)) {
            return res.status(400).json({
                success: false,
                error: `Format nomor tidak valid: ${phone} (gunakan format 62xxxxx)`
            });
        }

        if (String(message).trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Pesan tidak boleh kosong'
            });
        }

        const result = await sendTextMessage(phone, message);

        if (result.success) {
            return res.json({
                success: true,
                data: {
                    phone: phone,
                    jid: formatPhonetoJid(phone),
                    messageId: result.messageKey,
                    timestamp: result.timestamp,
                    message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
                }
            });
        }

        return res.status(400).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// 2. SEND MESSAGE BULK (Multiple Numbers)
// ============================================
/**
 * POST /api/whatsapp/send-bulk
 * 
 * Body:
 * {
 *   "phones": ["6281234567890", "6281234567891"],
 *   "message": "Pesan untuk beberapa orang"
 * }
 */
router.post('/send-bulk', async (req, res) => {
    try {
        const { phones, message } = req.body;

        if (!phones || !Array.isArray(phones) || phones.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'phones harus berupa array dengan minimal 1 nomor'
            });
        }

        if (!message || String(message).trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'message diperlukan dan tidak boleh kosong'
            });
        }

        const result = await sendTextMessageBulk(phones, message);

        return res.json({
            success: result.success,
            data: {
                totalSent: result.totalSent,
                totalFailed: result.totalFailed,
                results: result.results,
                failed: result.failed
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// 3. SEND BUTTON MESSAGE
// ============================================
/**
 * POST /api/whatsapp/send-button
 * 
 * Body:
 * {
 *   "phone": "6281234567890",
 *   "message": "Pilih opsi:",
 *   "buttons": [
 *     {"buttonId": "1", "buttonText": "Opsi 1"},
 *     {"buttonId": "2", "buttonText": "Opsi 2"}
 *   ]
 * }
 */
router.post('/send-button', async (req, res) => {
    try {
        const { phone, message, buttons } = req.body;

        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'phone dan message diperlukan'
            });
        }

        if (!isValidPhoneNumber(phone)) {
            return res.status(400).json({
                success: false,
                error: `Format nomor tidak valid: ${phone}`
            });
        }

        const result = await sendButtonMessage(phone, message, buttons);

        if (result.success) {
            return res.json({
                success: true,
                data: {
                    phone: phone,
                    messageId: result.messageKey
                }
            });
        }

        return res.status(400).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// 4. CHECK BOT STATUS
// ============================================
/**
 * GET /api/whatsapp/status
 * Check apakah bot sudah connected ke WhatsApp
 */
router.get('/status', async (req, res) => {
    try {
        const ready = isSocketReady();

        return res.json({
            success: true,
            data: {
                connected: ready,
                status: ready ? 'connected' : 'disconnected',
                message: ready ? '✅ Bot siap mengirim pesan' : '❌ Bot belum terhubung ke WhatsApp'
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// 5. VALIDATE PHONE NUMBER
// ============================================
/**
 * POST /api/whatsapp/validate-phone
 * Validasi format nomor WhatsApp
 */
router.post('/validate-phone', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'phone diperlukan'
            });
        }

        const isValid = isValidPhoneNumber(phone);

        return res.json({
            success: true,
            data: {
                phone: phone,
                valid: isValid,
                formatted: isValid ? formatPhonetoJid(phone) : null,
                message: isValid ? '✅ Format nomor valid' : '❌ Format nomor tidak valid (gunakan 62xxxxx)'
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;

/**
 * =======================================================
 * INTEGRASI KE MAIN APP (index.js)
 * =======================================================
 * 
 * Import di bagian atas:
 * import whatsappRouter from './api/whatsapp-gateway-api.js';
 * import { setWhatsAppSocket } from './libs/socket-manager.js';
 * import express from 'express';
 * 
 * Setup Express:
 * const app = express();
 * app.use(express.json());
 * app.use(express.urlencoded({ extended: true }));
 * 
 * Setelah socket terhubung (dalam handler connection.update):
 * if (connection === 'open') {
 *     setWhatsAppSocket(sock);  // <-- Tambahkan ini
 *     ...
 * }
 * 
 * Register API routes:
 * app.use('/api/whatsapp', whatsappRouter);
 * 
 * Start server:
 * app.listen(3000, () => {
 *     console.log('API running on port 3000');
 * });
 * 
 * =======================================================
 * CONTOH CURL REQUESTS
 * =======================================================
 * 
 * 1. Check Status:
 * curl http://localhost:3000/api/whatsapp/status \
 *   -H "x-api-key: your-secret-key"
 * 
 * 2. Send Text (Single):
 * curl -X POST http://localhost:3000/api/whatsapp/send-text \
 *   -H "Content-Type: application/json" \
 *   -H "x-api-key: your-secret-key" \
 *   -d '{
 *     "phone": "6281234567890",
 *     "message": "Halo dari API!"
 *   }'
 * 
 * 3. Send Bulk:
 * curl -X POST http://localhost:3000/api/whatsapp/send-bulk \
 *   -H "Content-Type: application/json" \
 *   -H "x-api-key: your-secret-key" \
 *   -d '{
 *     "phones": ["6281234567890", "6281234567891"],
 *     "message": "Pesan broadcast"
 *   }'
 * 
 * 4. Validate Phone:
 * curl -X POST http://localhost:3000/api/whatsapp/validate-phone \
 *   -H "Content-Type: application/json" \
 *   -H "x-api-key: your-secret-key" \
 *   -d '{"phone": "0812345678"}'
 * 
 * =======================================================
 * JAVASCRIPT/FETCH EXAMPLE
 * =======================================================
 * 
 * const API_KEY = "your-secret-key";
 * const BASE_URL = "http://localhost:3000/api/whatsapp";
 * 
 * async function sendWA(phone, message) {
 *     const response = await fetch(`${BASE_URL}/send-text`, {
 *         method: 'POST',
 *         headers: {
 *             'Content-Type': 'application/json',
 *             'x-api-key': API_KEY
 *         },
 *         body: JSON.stringify({ phone, message })
 *     });
 *     return response.json();
 * }
 * 
 * sendWA('6281234567890', 'Test!').then(console.log);
 */
