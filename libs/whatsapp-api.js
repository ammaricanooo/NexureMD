/**
 * WhatsApp Message Sender via Baileys
 * Mengirim pesan langsung tanpa perantara (no Fonnte needed)
 */

import { getWhatsAppSocket, isSocketReady } from './socket-manager.js';

/**
 * Kirim pesan teks ke satu nomor
 * @param {string} phoneNumber - Nomor dalam format 62xxxxx
 * @param {string} message - Isi pesan
 * @returns {Promise<{success: boolean, messageKey?: string, error?: string}>}
 */
export async function sendTextMessage(phoneNumber, message) {
    try {
        if (!isSocketReady()) {
            return {
                success: false,
                error: 'Bot belum terhubung ke WhatsApp'
            };
        }

        const sock = getWhatsAppSocket();
        
        // Format JID: nomor@s.whatsapp.net
        const jid = formatPhonetoJid(phoneNumber);
        
        if (!jid) {
            return {
                success: false,
                error: `Format nomor tidak valid: ${phoneNumber}`
            };
        }

        const result = await sock.sendMessage(jid, { text: message });

        return {
            success: true,
            messageKey: result.key.id,
            timestamp: result.messageTimestamp,
            recipient: jid
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Gagal mengirim pesan'
        };
    }
}

/**
 * Kirim pesan teks ke multiple nomor
 * @param {string[]} phoneNumbers - Array nomor dalam format 62xxxxx
 * @param {string} message - Isi pesan
 * @returns {Promise<{success: boolean, results: Array, failed: Array}>}
 */
export async function sendTextMessageBulk(phoneNumbers, message) {
    try {
        if (!isSocketReady()) {
            return {
                success: false,
                error: 'Bot belum terhubung ke WhatsApp'
            };
        }

        const sock = getWhatsAppSocket();
        const results = [];
        const failed = [];

        for (const phoneNumber of phoneNumbers) {
            try {
                const jid = formatPhonetoJid(phoneNumber);
                
                if (!jid) {
                    failed.push({
                        number: phoneNumber,
                        error: 'Format nomor tidak valid'
                    });
                    continue;
                }

                const result = await sock.sendMessage(jid, { text: message });
                results.push({
                    number: phoneNumber,
                    jid: jid,
                    messageId: result.key.id,
                    success: true
                });

                // Delay 100ms antara pesan untuk avoid rate limit
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                failed.push({
                    number: phoneNumber,
                    error: error.message
                });
            }
        }

        return {
            success: failed.length === 0,
            totalSent: results.length,
            totalFailed: failed.length,
            results,
            failed
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Bulk send failed'
        };
    }
}

/**
 * Kirim pesan media (gambar, video, audio, file)
 * @param {string} phoneNumber - Nomor tujuan
 * @param {Buffer|string} media - Buffer atau path file
 * @param {string} mediaType - 'image' | 'video' | 'audio' | 'document'
 * @param {string} caption - Caption untuk media
 * @returns {Promise<{success: boolean, messageKey?: string, error?: string}>}
 */
export async function sendMediaMessage(phoneNumber, media, mediaType = 'image', caption = '') {
    try {
        if (!isSocketReady()) {
            return {
                success: false,
                error: 'Bot belum terhubung ke WhatsApp'
            };
        }

        const sock = getWhatsAppSocket();
        const jid = formatPhonetoJid(phoneNumber);

        if (!jid) {
            return {
                success: false,
                error: `Format nomor tidak valid: ${phoneNumber}`
            };
        }

        const messagePayload = {
            [mediaType]: media,
            ...(caption && { caption })
        };

        const result = await sock.sendMessage(jid, messagePayload);

        return {
            success: true,
            messageKey: result.key.id,
            recipient: jid
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Gagal mengirim media'
        };
    }
}

/**
 * Kirim pesan dengan button
 * @param {string} phoneNumber - Nomor tujuan
 * @param {string} message - Isi pesan
 * @param {Array} buttons - Array {buttonId, buttonText, type}
 * @returns {Promise<{success: boolean, messageKey?: string, error?: string}>}
 */
export async function sendButtonMessage(phoneNumber, message, buttons = []) {
    try {
        if (!isSocketReady()) {
            return {
                success: false,
                error: 'Bot belum terhubung ke WhatsApp'
            };
        }

        if (!buttons || buttons.length === 0) {
            return sendTextMessage(phoneNumber, message);
        }

        const sock = getWhatsAppSocket();
        const jid = formatPhonetoJid(phoneNumber);

        if (!jid) {
            return {
                success: false,
                error: `Format nomor tidak valid: ${phoneNumber}`
            };
        }

        const buttonMessage = {
            text: message,
            buttons: buttons.map((btn, idx) => ({
                buttonId: btn.buttonId || `btn_${idx}`,
                buttonText: { displayText: btn.buttonText },
                type: btn.type || 'RESPONSE'
            }))
        };

        const result = await sock.sendMessage(jid, buttonMessage);

        return {
            success: true,
            messageKey: result.key.id,
            recipient: jid
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Gagal mengirim button message'
        };
    }
}

/**
 * Kirim pesan list
 * @param {string} phoneNumber - Nomor tujuan
 * @param {string} message - Isi pesan
 * @param {string} buttonText - Teks tombol list
 * @param {Array} sections - Array {title, rows: [{rowId, title, description}]}
 * @returns {Promise<{success: boolean, messageKey?: string, error?: string}>}
 */
export async function sendListMessage(phoneNumber, message, buttonText = 'Pilih opsi', sections = []) {
    try {
        if (!isSocketReady()) {
            return {
                success: false,
                error: 'Bot belum terhubung ke WhatsApp'
            };
        }

        const sock = getWhatsAppSocket();
        const jid = formatPhonetoJid(phoneNumber);

        if (!jid) {
            return {
                success: false,
                error: `Format nomor tidak valid: ${phoneNumber}`
            };
        }

        const listMessage = {
            text: message,
            sections: sections,
            buttonText: buttonText
        };

        const result = await sock.sendMessage(jid, listMessage);

        return {
            success: true,
            messageKey: result.key.id,
            recipient: jid
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Gagal mengirim list message'
        };
    }
}

/**
 * Format nomor ke JID format
 * Format: 62xxxxx@s.whatsapp.net
 * @param {string|number} phone - Nomor dalam format 62xxxxx atau 0xxxxx
 * @returns {string|null} JID atau null jika format tidak valid
 */
export function formatPhonetoJid(phone) {
    if (!phone) return null;

    // Convert ke string dan buang non-digit
    let cleaned = String(phone).replace(/\D/g, '');

    // Jika dimulai dengan 0, ganti dengan 62
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
    }

    // Jika belum dimulai dengan 62, assume Indonesia
    if (!cleaned.startsWith('62') && cleaned.length >= 9) {
        cleaned = '62' + cleaned;
    }

    // Validasi: harus dimulai 62 dan minimal 10 digit
    if (!cleaned.startsWith('62') || cleaned.length < 10) {
        return null;
    }

    return `${cleaned}@s.whatsapp.net`;
}

/**
 * Format JID kembali ke nomor
 * @param {string} jid - Format 62xxxxx@s.whatsapp.net
 * @returns {string} Nomor dalam format 62xxxxx
 */
export function formatJidtoPhone(jid) {
    if (!jid) return null;
    return jid.split('@')[0];
}

/**
 * Validasi format nomor
 * @param {string|number} phone - Nomor dalam format apapun
 * @returns {boolean} true jika valid
 */
export function isValidPhoneNumber(phone) {
    return formatPhonetoJid(phone) !== null;
}

export default {
    sendTextMessage,
    sendTextMessageBulk,
    sendMediaMessage,
    sendButtonMessage,
    sendListMessage,
    formatPhonetoJid,
    formatJidtoPhone,
    isValidPhoneNumber
};
