import axios from 'axios';
import config from '../config.js';

// Penyimpanan sesi interaktif di memori (TTL 10 Menit)
const sessions = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000;

// Pembersihan berkala setiap 5 menit untuk sesi kadaluwarsa
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, session] of sessions.entries()) {
        if (now - session.createdAt > SESSION_TTL_MS) {
            sessions.delete(key);
        }
    }
}, 5 * 60 * 1000);

if (cleanupTimer?.unref) {
    cleanupTimer.unref();
}

/**
 * Menyimpan sesi pencarian PDDIKTI untuk dibalas dengan angka 1-10
 */
export function setPddiktiSession({ messageId, remoteJid, senderJid, items }) {
    if (!Array.isArray(items) || items.length === 0) return;

    const sessionData = {
        type: 'pddikti',
        items: items.map(item => ({
            id: item.id,
            nama: item.nama || '-',
            nim: item.nim || '-',
            nama_pt: item.nama_pt || '-',
            nama_prodi: item.nama_prodi || '-',
        })),
        remoteJid,
        senderJid,
        createdAt: Date.now(),
    };

    if (messageId) {
        sessions.set(messageId, sessionData);
    }
    if (remoteJid && senderJid) {
        sessions.set(`${remoteJid}:${senderJid}`, sessionData);
    }
}

/**
 * Format detail mahasiswa menjadi teks WhatsApp rapi
 */
export function formatMahasiswaDetail(detail, fallback = {}) {
    const nama = detail.nama || fallback.nama || '-';
    const nim = detail.nim || fallback.nim || '-';
    const rawJk = detail.jenis_kelamin || '';
    const jk = rawJk === 'L' ? 'Laki-laki' : rawJk === 'P' ? 'Perempuan' : (rawJk || '-');
    const pt = detail.nama_pt || fallback.nama_pt || '-';
    const kodePt = detail.kode_pt ? ` (${detail.kode_pt})` : '';
    const prodi = detail.prodi || detail.nama_prodi || fallback.nama_prodi || '-';
    const kodeProdi = detail.kode_prodi ? ` (${detail.kode_prodi})` : '';
    const jenjang = detail.jenjang || '-';
    const status = detail.status_saat_ini || '-';
    const jenisDaftar = detail.jenis_daftar || '-';
    const tglMasuk = detail.tanggal_masuk || '-';

    return `🎓 *DETAIL MAHASISWA PDDIKTI* 🎓\n\n` +
        `👤 *Nama:* ${nama}\n` +
        `🔢 *NIM:* ${nim}\n` +
        `⚧ *Jenis Kelamin:* ${jk}\n` +
        `🏫 *Perguruan Tinggi:* ${pt}${kodePt}\n` +
        `📚 *Program Studi:* ${prodi}${kodeProdi}\n` +
        `🎓 *Jenjang:* ${jenjang}\n` +
        `📌 *Status Saat Ini:* ${status}\n` +
        `📝 *Jenis Pendaftaran:* ${jenisDaftar}\n` +
        `📅 *Tanggal Masuk:* ${tglMasuk}\n\n` +
        `Horeee! Itu tadi detail lengkapnya kak~ (๑>ᴗ<๑)`;
}

/**
 * Menangani balasan angka (1-10) untuk sesi interaktif
 */
export async function handleInteractiveReply(sock, m, msgData, explicitNum = null) {
    try {
        const text = msgData.messageContent?.trim();
        let selectedIndex = explicitNum;

        if (selectedIndex === null) {
            if (!text) return false;
            // Cek apakah pesan berupa angka 1 sampai 10
            const match = text.match(/^([1-9]|10)$/);
            if (!match) return false;
            selectedIndex = parseInt(match[1], 10);
        }

        if (isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > 10) {
            return false;
        }

        // Cari sesi yang aktif
        let session = null;
        const now = Date.now();

        // 1. Prioritaskan jika user me-reply (quote) pesan hasil pencarian bot
        const quotedId = msgData.contextInfo?.stanzaId;
        if (quotedId && sessions.has(quotedId)) {
            const s = sessions.get(quotedId);
            if (now - s.createdAt <= SESSION_TTL_MS) {
                session = s;
            } else {
                sessions.delete(quotedId);
            }
        }

        // 2. Jika tidak me-quote, cari berdasarkan user di chat yang sama
        if (!session) {
            const userKey = `${msgData.remoteJid}:${msgData.senderJid}`;
            if (sessions.has(userKey)) {
                const s = sessions.get(userKey);
                if (now - s.createdAt <= SESSION_TTL_MS) {
                    session = s;
                } else {
                    sessions.delete(userKey);
                }
            }
        }

        if (!session) return false;

        // Tangani sesi tipe PDDIKTI
        if (session.type === 'pddikti') {
            if (selectedIndex > session.items.length) {
                await sock.sendMessage(msgData.remoteJid, {
                    text: `Uwaaa! Nomor *${selectedIndex}* nggak ada di daftar kak.. (｡T ω T｡)\nSilakan pilih angka antara *1* sampai *${session.items.length}* yaa~`
                }, { quoted: m });
                return true;
            }

            const item = session.items[selectedIndex - 1];
            if (!item?.id) return false;

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '⏳', key: m.key }
            });

            try {
                const url = `${config.API_AMMARICANO}/api/search/pddikti/detail?id=${encodeURIComponent(item.id)}`;
                const res = await axios.get(url);
                const detail = res.data?.result;

                if (!detail || typeof detail !== 'object') {
                    await sock.sendMessage(msgData.remoteJid, {
                        react: { text: '❌', key: m.key }
                    });
                    await sock.sendMessage(msgData.remoteJid, {
                        text: `Maafin Nexure kak, detail mahasiswa "${item.nama}" gagal diambil.. (｡T ω T｡)`
                    }, { quoted: m });
                    return true;
                }

                const detailMessage = formatMahasiswaDetail(detail, item);

                await sock.sendMessage(msgData.remoteJid, {
                    text: detailMessage.trim()
                }, { quoted: m });

                await sock.sendMessage(msgData.remoteJid, {
                    react: { text: '✅', key: m.key }
                });

                return true;
            } catch (err) {
                console.error('[PDDIKTI Interactive Detail Error]:', err.message);
                await sock.sendMessage(msgData.remoteJid, {
                    react: { text: '❌', key: m.key }
                });
                const errMsg = err.response?.data?.result?.error || err.response?.data?.message || err.message || 'Internal Server Error';
                await sock.sendMessage(msgData.remoteJid, {
                    text: `Uwaaa gawat! Nexure gagal ambil detail mahasiswanya kak.. (╥﹏╥)\n\n*Error:* ${errMsg}`
                }, { quoted: m });
                return true;
            }
        }

        return false;
    } catch (err) {
        console.error('[handleInteractiveReply Error]:', err);
        return false;
    }
}

