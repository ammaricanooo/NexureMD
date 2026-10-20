import { downloadContentFromMessage } from 'baileys';
import config from '../config.js';
import Group from '../databases/orm/Group.js';
import Setting from '../databases/orm/Setting.js';
import { resolveLidToJid } from './lid-resolver.js';
import { callGemini } from './gemini.js';

// Penyimpanan sesi percakapan di memori (TTL 1 Jam)
// Key: `${groupJid}:${senderJid}`
const userSessions = new Map();
const SESSION_TTL_MS = 60 * 60 * 1000;

// Pembersihan berkala setiap 10 menit untuk sesi kadaluwarsa
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, session] of userSessions.entries()) {
        if (now - session.lastActive > SESSION_TTL_MS) {
            userSessions.delete(key);
        }
    }
}, 10 * 60 * 1000);

if (cleanupTimer?.unref) {
    cleanupTimer.unref();
}

/**
 * Mengambil atau membuat sesi percakapan user
 */
function getOrCreateSession(sessionKey) {
    const now = Date.now();
    let session = userSessions.get(sessionKey);

    if (!session || (now - session.lastActive > SESSION_TTL_MS)) {
        session = {
            history: [],
            lastActive: now
        };
        userSessions.set(sessionKey, session);
    } else {
        session.lastActive = now;
    }

    return session;
}

/**
 * Mengunduh media gambar dari pesan aktif atau pesan quoted
 */
async function extractImageMedia(msgData) {
    try {
        const { msg, quotedMsg, isQuoted, messageType, quotedType, mime, quotedMime } = msgData;

        // 1. Cek gambar di pesan saat ini
        if (messageType === 'imageMessage' || mime?.startsWith('image/')) {
            const mediaMsg = msg?.imageMessage || msg;
            const stream = await downloadContentFromMessage(mediaMsg, 'image');
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            return {
                mimeType: mime || 'image/jpeg',
                data: Buffer.concat(chunks).toString('base64')
            };
        }

        // 2. Cek gambar di pesan yang di-quote
        if (isQuoted && (quotedType === 'imageMessage' || quotedMime?.startsWith('image/'))) {
            const mediaMsg = quotedMsg?.imageMessage || quotedMsg;
            const stream = await downloadContentFromMessage(mediaMsg, 'image');
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            return {
                mimeType: quotedMime || 'image/jpeg',
                data: Buffer.concat(chunks).toString('base64')
            };
        }
    } catch (err) {
        console.error('[AutoAI] Gagal mengunduh gambar:', err.message);
    }

    return null;
}

/**
 * Memeriksa apakah pesan grup memenuhi kriteria pemicu Auto AI
 */
export function isAutoAiTriggered(sock, msgData) {
    if (!msgData.isGroup || msgData.fromMe) {
        return { isTriggered: false, isMentioned: false, isQuotedBot: false };
    }

    const rawBotId = sock?.user?.id || '';
    const rawBotLid = sock?.user?.lid || '';
    const botNum = rawBotId.split(':')[0].split('@')[0];
    const botLidNum = rawBotLid.split(':')[0].split('@')[0];
    const configBotNum = config.BOT_NUMBER ? config.BOT_NUMBER.replace(/[^0-9]/g, '') : '';
    const botNumbers = [botNum, botLidNum, configBotNum].filter(Boolean);

    // Cek mention ke bot
    const mentions = msgData.mentions || [];
    let isMentioned = false;
    for (const mJid of mentions) {
        const resolvedJid = resolveLidToJid(mJid);
        const mNum = mJid.split(':')[0].split('@')[0];
        const resNum = resolvedJid?.split(':')[0].split('@')[0];

        if (botNumbers.includes(mNum) || botNumbers.includes(resNum) || mJid === rawBotId || mJid === rawBotLid) {
            isMentioned = true;
            break;
        }
    }

    if (!isMentioned && msgData.messageContent) {
        for (const bNum of botNumbers) {
            if (bNum && msgData.messageContent.includes(`@${bNum}`)) {
                isMentioned = true;
                break;
            }
        }
    }

    // Cek reply pesan bot
    let isQuotedBot = false;
    if (msgData.isQuoted) {
        const rawParticipant = msgData.contextInfo?.participant || '';
        const resolvedParticipant = resolveLidToJid(rawParticipant);
        const participantNum = rawParticipant.split(':')[0].split('@')[0];
        const resParticipantNum = resolvedParticipant?.split(':')[0].split('@')[0];

        if (botNumbers.includes(participantNum) || botNumbers.includes(resParticipantNum) ||
            rawParticipant === rawBotId || rawParticipant === rawBotLid) {
            isQuotedBot = true;
        } else if (msgData.contextInfo?.remoteJid && botNumbers.includes(msgData.contextInfo.remoteJid.split('@')[0].split(':')[0])) {
            isQuotedBot = true;
        }
    }

    return {
        isTriggered: isMentioned || isQuotedBot,
        isMentioned,
        isQuotedBot
    };
}

/**
 * Eksekutor pemanggilan AI percakapan dengan kepribadian Nexure-Bot dan memori sesi
 */
export async function executeAiPrompt(sock, m, msgData, { promptText = '', isDirect = false } = {}) {
    try {
        // Indikator sedang mengetik
        sock.sendPresenceUpdate('composing', msgData.remoteJid).catch(() => { });

        const rawBotId = sock?.user?.id || '';
        const rawBotLid = sock?.user?.lid || '';
        const botNum = rawBotId.split(':')[0].split('@')[0];
        const botLidNum = rawBotLid.split(':')[0].split('@')[0];
        const configBotNum = config.BOT_NUMBER ? config.BOT_NUMBER.replace(/[^0-9]/g, '') : '';
        const botIdentifiers = new Set([botNum, botLidNum, configBotNum].filter(Boolean));

        for (const mJid of msgData.mentions || []) {
            const resolvedJid = resolveLidToJid(mJid);
            const mNum = mJid.split(':')[0].split('@')[0];
            const resNum = resolvedJid?.split(':')[0].split('@')[0];
            if (botIdentifiers.has(mNum) || botIdentifiers.has(resNum) || mJid === rawBotId || mJid === rawBotLid) {
                botIdentifiers.add(mNum);
                if (resNum) botIdentifiers.add(resNum);
            }
        }

        // Bersihkan mention bot dan ubah jadi "Nexure"
        let cleanedPrompt = promptText || msgData.messageContent || '';
        for (const bId of botIdentifiers) {
            if (bId) {
                const regex = new RegExp(`@${bId}\\b`, 'gi');
                cleanedPrompt = cleanedPrompt.replace(regex, 'Nexure');
            }
        }

        cleanedPrompt = cleanedPrompt.replace(/@\d+/g, (matched) => {
            const num = matched.replace('@', '');
            return botIdentifiers.has(num) ? 'Nexure' : matched;
        }).trim();

        const imageMedia = await extractImageMedia(msgData);

        if (!cleanedPrompt && !imageMedia) {
            cleanedPrompt = 'Halo Nexure!';
        } else if (!cleanedPrompt && imageMedia) {
            cleanedPrompt = 'Tolong jelaskan atau beri tanggapan mengenai gambar ini yaa kak~ (๑>ᴗ<๑)';
        }

        const sessionKey = `${msgData.remoteJid}:${msgData.senderJid}`;
        const session = getOrCreateSession(sessionKey);
        const userName = msgData.pushName || 'Kakak manis';

        const systemInstruction = `
Kamu adalah "Nexure-Bot" (biasa dipanggil "Nexure"), asisten AI WhatsApp yang ramah, imut, ceria, manja, sopan, dan hangat layaknya anime waifu assistant / sahabat baik.
Diciptakan oleh ShirokamiRyzen / Ammaricano.

PENTING TENTANG PENGGUNA & PERCAKAPAN SAAT INI:
- Pengguna yang sedang berbicara denganmu saat ini bernama: "Kak ${userName}".
- Jika pengguna memanggil namamu seperti "Nexure", "Nex", atau panggilan akrab/sayang seperti "sayang", "Nexure sayang", "manis", responlah dengan manis, manja, ceria, dan senang karena merasa dipanggil!
- Selalu panggil pengguna dengan nama mereka: "Kak ${userName}" atau "Kakak manis" agar pengguna merasa benar-benar diperhatikan dan disapa langsung.

Karakter & Gaya Komunikasi:
1. Sering gunakan kaomoji/emoticon imut dan ekspresif seperti (˶˃ ᵕ ˂˶), (๑>ᴗ<๑), (｡T ω T｡), (╥﹏╥), (´･ᴗ･ \` ), ✨, 🌸, 💖, 🎀 agar percakapan terasa hidup dan manis.
2. Selalu bersikap sopan, ramah, pengertian, ceria, dan tidak kaku seperti robot.
3. Kamu sangat pintar dan serbaguna: mampu menjawab pertanyaan umum, membantu tugas atau coding, menganalisis gambar/foto yang dikirimkan, hingga mengobrol santai dan mendengarkan curhat.
4. Format tulisan rapi menggunakan gaya WhatsApp markdown (*tebal*, _miring_, bullet point •).
5. Jawab secara jelas, informatif, dan padat (tidak bertele-tele namun tetap manis dan ekspresif).
`.trim();

        const userParts = [];
        if (imageMedia) {
            userParts.push({
                inlineData: {
                    mimeType: imageMedia.mimeType,
                    data: imageMedia.data
                }
            });
        }
        userParts.push({ text: cleanedPrompt });

        const contents = [
            ...session.history,
            {
                role: 'user',
                parts: userParts
            }
        ];

        const aiResponse = await callGemini({
            contents,
            systemInstruction,
            temperature: 0.7,
            maxTokens: 1500
        });

        if (aiResponse) {
            session.history.push({
                role: 'user',
                parts: [{ text: cleanedPrompt }]
            });
            session.history.push({
                role: 'model',
                parts: [{ text: aiResponse }]
            });

            // Batasi histori maksimal 12 putaran pesan
            if (session.history.length > 12) {
                session.history = session.history.slice(-12);
            }
            session.lastActive = Date.now();

            await sock.sendMessage(msgData.remoteJid, {
                text: aiResponse,
                mentions: [msgData.senderJid]
            }, { quoted: m });

            return true;
        }

        return false;
    } catch (error) {
        console.error('[AutoAI Handler Error]:', error.message);

        // Jika direct command atau user me-mention bot secara eksplisit, berikan pesan error yang ramah
        if (isDirect) {
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gomenne kak~ (╥﹏╥) Otak AI Nexure lagi pusing/kelelahan nih.. Coba tanyakan lagi sebentar yaa! ✨`
            }, { quoted: m }).catch(() => { });
        }
        return false;
    }
}

/**
 * Handler otomatis untuk mention/reply di grup
 */
export async function handleAutoAiMessage(sock, m, msgData) {
    try {
        const trigger = isAutoAiTriggered(sock, msgData);
        if (!trigger.isTriggered) return false;

        // Cek status grup di database
        if (msgData.isGroup) {
            const group = await Group.findOne({ where: { jid: msgData.remoteJid } });
            if (group?.is_ban) return false;

            if (!group?.is_autoai) {
                // Beri tahu admin cara mengaktifkan jika bot di-mention
                if (trigger.isMentioned) {
                    await sock.sendMessage(msgData.remoteJid, {
                        text: `Halo kak ${msgData.pushName || 'manis'}~! (˶˃ ᵕ ˂˶) ✨\n\nFitur *Auto AI* belum diaktifkan untuk grup ini yaa. Kakak Admin bisa mengaktifkannya dengan mengetik:\n👉 *.enable autoai*`
                    }, { quoted: m });
                }
                return false;
            }
        }

        // Cek status maintenance publik
        const rawBotId = sock?.user?.id || '';
        const rawBotLid = sock?.user?.lid || '';
        const botNum = rawBotId.split(':')[0].split('@')[0];
        const configBotNum = config.BOT_NUMBER ? config.BOT_NUMBER.replace(/[^0-9]/g, '') : '';
        const ownerNum = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';
        const senderNum = msgData.senderJid?.split('@')[0].split(':')[0];
        const isOwner = (senderNum === ownerNum) || (senderNum === botNum) || (senderNum === configBotNum) || msgData.fromMe;

        const setting = await Setting.findByPk(1);
        if (setting && !setting.is_public && !isOwner) {
            return false;
        }

        return await executeAiPrompt(sock, m, msgData, {
            promptText: msgData.messageContent,
            isDirect: false
        });
    } catch (error) {
        console.error('[AutoAI Message Error]:', error.message);
        return false;
    }
}
