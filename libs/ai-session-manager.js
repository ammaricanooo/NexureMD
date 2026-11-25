import fs from 'node:fs';
import path from 'node:path';

const SESSIONS_DIR = path.resolve(process.cwd(), 'sessions_ai');
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const MAX_HISTORY_ITEMS = 16;

if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

const memoryCache = new Map();

function getSessionFilePath(sessionKey) {
    const sanitized = String(sessionKey || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(SESSIONS_DIR, `${sanitized}.json`);
}

/**
 * Memuat sesi AI dari memori atau file JSON persisten
 * @param {string} sessionKey
 * @returns {{ history: Array, lastActive: number, nonce: number }}
 */
export function getSession(sessionKey) {
    const now = Date.now();
    let session = memoryCache.get(sessionKey);

    if (!session) {
        try {
            const filePath = getSessionFilePath(sessionKey);
            if (fs.existsSync(filePath)) {
                const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                if (parsed && Array.isArray(parsed.history)) {
                    session = {
                        history: parsed.history,
                        lastActive: Number(parsed.lastActive) || now,
                        nonce: Number(parsed.nonce) || 0
                    };
                }
            }
        } catch (err) {
            console.warn(`[AiSessionManager] Gagal membaca sesi ${sessionKey}:`, err.message);
        }
    }

    if (!session || (now - session.lastActive > SESSION_TTL_MS)) {
        session = {
            history: [],
            lastActive: now,
            nonce: (session?.nonce || 0) + 1
        };
    } else {
        session.lastActive = now;
    }

    memoryCache.set(sessionKey, session);
    return session;
}

/**
 * Menyimpan riwayat sesi AI ke memori dan disk
 * @param {string} sessionKey
 * @param {{ history: Array, lastActive: number, nonce: number }} session
 */
export function saveSession(sessionKey, session) {
    if (!session) return;
    if (session.history.length > MAX_HISTORY_ITEMS) {
        session.history = session.history.slice(-MAX_HISTORY_ITEMS);
    }
    session.lastActive = Date.now();
    memoryCache.set(sessionKey, session);

    try {
        const filePath = getSessionFilePath(sessionKey);
        fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
    } catch (err) {
        console.warn(`[AiSessionManager] Gagal menyimpan sesi ${sessionKey}:`, err.message);
    }
}

/**
 * Mereset/menghapus riwayat sesi AI milik user dan merotasi nonce DeeperSeeker
 * @param {string} sessionKey
 */
export function clearSession(sessionKey) {
    const prev = memoryCache.get(sessionKey);
    const nextNonce = (prev?.nonce || 0) + 1;
    const fresh = {
        history: [],
        lastActive: Date.now(),
        nonce: nextNonce
    };
    memoryCache.set(sessionKey, fresh);

    try {
        const filePath = getSessionFilePath(sessionKey);
        if (fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(fresh, null, 2), 'utf-8');
        }
    } catch (err) {
        console.warn(`[AiSessionManager] Gagal mereset sesi ${sessionKey}:`, err.message);
    }
    return fresh;
}

/**
 * Membersihkan cache memori berkala untuk sesi yang kadaluwarsa
 */
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, session] of memoryCache.entries()) {
        if (now - session.lastActive > SESSION_TTL_MS) {
            memoryCache.delete(key);
        }
    }
}, 15 * 60 * 1000);

if (cleanupTimer?.unref) {
    cleanupTimer.unref();
}
