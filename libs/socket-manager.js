/**
 * Socket Manager - Centralized WhatsApp Socket Management
 * Digunakan untuk share socket ke API routes dan modules lainnya
 */

let whatsappSocket = null;

/**
 * Set WhatsApp socket (dipanggil dari index.js saat bot berhasil login)
 * @param {object} socket - Baileys socket instance
 */
export function setWhatsAppSocket(socket) {
    whatsappSocket = socket;
    console.log('✅ WhatsApp socket registered to manager');
}

/**
 * Get WhatsApp socket (digunakan oleh API routes)
 * @returns {object|null} Baileys socket instance atau null jika belum connected
 */
export function getWhatsAppSocket() {
    return whatsappSocket;
}

/**
 * Check apakah socket sudah tersedia
 * @returns {boolean}
 */
export function isSocketReady() {
    return whatsappSocket !== null;
}

/**
 * Reset socket (saat disconnect/logout)
 */
export function resetSocket() {
    whatsappSocket = null;
    console.log('⚠️ WhatsApp socket reset');
}

export default {
    setWhatsAppSocket,
    getWhatsAppSocket,
    isSocketReady,
    resetSocket
};
