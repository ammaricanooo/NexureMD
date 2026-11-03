const groupCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 menit TTL

/**
 * Menyimpan metadata grup ke dalam cache.
 * @param {string} jid 
 * @param {object} metadata 
 */
export const setGroupMetadata = (jid, metadata) => {
    if (!jid || !metadata) return;
    groupCache.set(jid, {
        data: metadata,
        timestamp: Date.now()
    });
};

/**
 * Mengambil metadata grup dari cache.
 * @param {string} jid 
 * @returns {object|null}
 */
export const getGroupMetadata = (jid) => {
    const entry = groupCache.get(jid);
    if (!entry) return null;

    // Fallback jika entry objek metadata lama tanpa wrapper timestamp
    if (!entry.timestamp && entry.id) {
        return entry;
    }

    if (Date.now() - entry.timestamp > CACHE_TTL) {
        groupCache.delete(jid);
        return null;
    }
    return entry.data;
};

/**
 * Menghapus cache grup tertentu.
 * @param {string} jid 
 */
export const deleteGroupMetadata = (jid) => {
    if (jid) {
        groupCache.delete(jid);
    }
};

/**
 * Menghapus semua cache grup.
 */
export const clearGroupCache = () => {
    groupCache.clear();
};

export default groupCache;
