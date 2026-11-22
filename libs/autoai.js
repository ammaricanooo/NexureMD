import { downloadContentFromMessage } from 'baileys';
import AdmZip from 'adm-zip';
import config from '../config.js';
import Group from '../databases/orm/Group.js';
import Setting from '../databases/orm/Setting.js';
import { resolveLidToJid } from './lid-resolver.js';
import { callDeeperSeeker } from './deeperseeker.js';
import { callGemini } from './gemini.js';

// Penyimpanan sesi percakapan di memori lokal (TTL 1 Jam)
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
 * Normalisasi MIME type untuk media
 */
function normalizeMimeForGemini(rawMime, fileName = '') {
    if (!rawMime) rawMime = '';
    let mime = rawMime.split(';')[0].trim().toLowerCase();

    const ext = fileName ? fileName.split('.').pop().toLowerCase() : '';
    if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ext === 'doc') return 'application/msword';
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (ext === 'xls') return 'application/vnd.ms-excel';
    if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (ext === 'ppt') return 'application/vnd.ms-powerpoint';
    if (['txt', 'csv', 'json', 'js', 'ts', 'py', 'html', 'css', 'md', 'xml', 'sql', 'log', 'sh', 'env', 'yaml', 'yml'].includes(ext)) {
        return 'text/plain';
    }

    if (mime === 'audio/ogg' || mime === 'audio/opus') return 'audio/ogg';
    if (mime.startsWith('image/')) return mime;
    if (mime.startsWith('video/')) return mime;
    if (mime.startsWith('audio/')) return mime;
    if (mime.startsWith('text/')) return 'text/plain';

    return mime || 'application/octet-stream';
}

/**
 * Ekstraksi teks dari file Word .docx menggunakan AdmZip
 */
function extractTextFromDocx(buffer) {
    try {
        const zip = new AdmZip(buffer);
        const xml = zip.readAsText('word/document.xml');
        if (xml) {
            return xml
                .replace(/<w:p[^>]*>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .trim();
        }
    } catch (_) { }
    return null;
}

/**
 * Ekstraksi teks dari file dokumen (Word .docx, teks polos, json, csv, kode pemrograman, dll)
 */
function extractTextFromDocument(buffer, fileName = '', mimeType = '') {
    if (!buffer) return null;
    const lowerName = (fileName || '').toLowerCase();
    if (lowerName.endsWith('.docx') || (mimeType && mimeType.includes('wordprocessingml'))) {
        return extractTextFromDocx(buffer);
    }
    const textExts = ['.txt', '.csv', '.json', '.js', '.ts', '.py', '.html', '.css', '.md', '.xml', '.sql', '.log', '.sh', '.env', '.yaml', '.yml'];
    const isTextExt = textExts.some(ext => lowerName.endsWith(ext));
    if (isTextExt || (mimeType && mimeType.startsWith('text/'))) {
        try {
            return buffer.toString('utf-8').trim();
        } catch (_) { }
    }
    return null;
}

/**
 * Mengunduh media (gambar, dokumen Word/PDF/Teks, audio/VN, video) dari pesan aktif atau pesan quoted
 */
export async function extractAiMedia(msgData) {
    try {
        const { msg, quotedMsg, isQuoted, messageType, quotedType, mime, quotedMime, fileName } = msgData;

        let targetMsg = null;
        let targetType = '';
        let targetMime = '';
        let targetFileName = fileName || '';

        // Prioritaskan media yang di-quote jika ada, lalu media pada pesan saat ini
        if (isQuoted && /imageMessage|documentMessage|audioMessage|videoMessage/.test(quotedType)) {
            targetMsg = quotedMsg?.[quotedType] || quotedMsg;
            targetType = quotedType;
            targetMime = quotedMime || targetMsg?.mimetype || '';
            targetFileName = quotedMsg?.[quotedType]?.fileName || targetFileName || '';
        } else if (/imageMessage|documentMessage|audioMessage|videoMessage/.test(messageType)) {
            targetMsg = msg?.[messageType] || msg;
            targetType = messageType;
            targetMime = mime || targetMsg?.mimetype || '';
            targetFileName = msg?.[messageType]?.fileName || targetFileName || '';
        }

        if (!targetMsg || !targetType) return null;

        let downloadType = 'image';
        let category = 'image';
        if (targetType === 'documentMessage') {
            downloadType = 'document';
            category = 'document';
        } else if (targetType === 'audioMessage') {
            downloadType = 'audio';
            category = 'audio';
        } else if (targetType === 'videoMessage') {
            downloadType = 'video';
            category = 'video';
        } else if (targetType === 'imageMessage') {
            downloadType = 'image';
            category = 'image';
        }

        const stream = await downloadContentFromMessage(targetMsg, downloadType);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        if (buffer.length > 20 * 1024 * 1024) {
            return { isTooLarge: true, size: buffer.length };
        }

        const normalizedMime = normalizeMimeForGemini(targetMime, targetFileName);

        return {
            buffer,
            data: buffer.toString('base64'),
            mimeType: normalizedMime,
            fileName: targetFileName,
            category
        };
    } catch (err) {
        console.error('[AutoAI] Gagal mengunduh media:', err.message);
        return null;
    }
}

// Alias untuk kompatibilitas
export const extractImageMedia = extractAiMedia;

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
 * Eksekutor pemanggilan AI percakapan dengan DeeperSeeker Multimodal & kepribadian Nexure-Bot
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

        // Cek flag --think atau -t untuk mode deep reasoning
        let think = false;
        if (/\b(--think|-t)\b/i.test(cleanedPrompt)) {
            think = true;
            cleanedPrompt = cleanedPrompt.replace(/\b(--think|-t)\b/gi, '').trim();
        }

        const userName = msgData.pushName || 'Kakak manis';

        // Ambil konteks pesan yang di-reply/dikutip (jika ada)
        let quotedContext = '';
        if (msgData.isQuoted && msgData.quotedContent) {
            const rawParticipant = msgData.contextInfo?.participant || '';
            const resolvedParticipant = resolveLidToJid(rawParticipant);
            const participantNum = (resolvedParticipant || rawParticipant).split('@')[0].split(':')[0];
            const isQuotedSelf = botIdentifiers.has(participantNum) || rawParticipant === rawBotId || rawParticipant === rawBotLid;

            if (isQuotedSelf) {
                quotedContext = `[Pesan Nexure sebelumnya yang sedang di-reply oleh Kak ${userName}]:\n"${msgData.quotedContent.trim()}"\n\n`;
            } else {
                const senderLabel = participantNum ? `@${participantNum}` : 'anggota lain';
                quotedContext = `[Pesan dari ${senderLabel} yang sedang di-reply/dikutip oleh Kak ${userName}]:\n"${msgData.quotedContent.trim()}"\n\n`;
            }
        }

        const aiMedia = await extractAiMedia(msgData);

        if (aiMedia?.isTooLarge) {
            await sock.sendMessage(msgData.remoteJid, {
                text: 'Aduuh kak.. (｡T ω T｡) Ukuran file terlalu besar untuk diproses AI (maksimal 20 MB). Coba kirim file yang lebih kecil yaa~ ✨'
            }, { quoted: m });
            return false;
        }

        // Ekstraksi teks jika lampiran adalah dokumen (Word .docx, file teks/kode/data)
        let extractedDocText = null;
        if (aiMedia?.category === 'document') {
            extractedDocText = extractTextFromDocument(aiMedia.buffer, aiMedia.fileName, aiMedia.mimeType);
        }

        if (!cleanedPrompt && !aiMedia) {
            if (quotedContext) {
                cleanedPrompt = 'Tolong baca, tanggapi, dan berikan jawaban atau penjelasan mengenai pesan yang sedang di-reply ini yaa kak~ (๑>ᴗ<๑)';
            } else {
                cleanedPrompt = 'Halo Nexure!';
            }
        } else if (!cleanedPrompt && aiMedia) {
            if (aiMedia.category === 'document') {
                const docName = aiMedia.fileName ? ` "${aiMedia.fileName}"` : '';
                cleanedPrompt = `Tolong baca, analisis, dan jelaskan isi penting dari dokumen${docName} ini yaa kak~ (๑>ᴗ<๑)`;
            } else if (aiMedia.category === 'audio') {
                cleanedPrompt = 'Tolong dengarkan dan transkrip serta beri tanggapan mengenai isi rekaman suara/voice note ini yaa kak~ (˶˃ ᵕ ˂˶)';
            } else if (aiMedia.category === 'video') {
                cleanedPrompt = 'Tolong jelaskan dan rangkum apa yang terjadi di dalam video ini yaa kak~ (๑>ᴗ<๑)';
            } else {
                cleanedPrompt = 'Tolong jelaskan atau beri tanggapan mengenai gambar ini yaa kak~ (๑>ᴗ<๑)';
            }
        }

        // Susun teks prompt lengkap termasuk dokumen dan quoted context
        let fullPromptText = cleanedPrompt;
        if (extractedDocText) {
            const docName = aiMedia.fileName ? ` "${aiMedia.fileName}"` : '';
            fullPromptText = `[Isi Dokumen Word/Teks${docName}]:\n${extractedDocText}\n\n${fullPromptText}`;
        }
        if (quotedContext) {
            fullPromptText = `${quotedContext}[Instruksi/Pesan dari Kak ${userName}]:\n${fullPromptText}`;
        }

        const sessionKey = `${msgData.remoteJid}:${msgData.senderJid}`;
        const safeSessionId = sessionKey.replace(/[^a-zA-Z0-9_-]/g, '_');
        const session = getOrCreateSession(sessionKey);

        const systemInstruction = `
Kamu adalah "Nexure-Bot" (biasa dipanggil "Nexure"), asisten AI WhatsApp yang ramah, imut, ceria, manja, sopan, dan hangat layaknya anime waifu assistant / sahabat baik.
Diciptakan oleh Ammar / Ammaricano.

PENTING TENTANG PENGGUNA & PERCAKAPAN SAAT INI:
- Pengguna yang sedang berbicara denganmu saat ini bernama: "${userName}".
- Jika pengguna me-reply pesan seseorang, pesan yang di-reply akan disertakan dalam format: [Pesan dari ... yang sedang di-reply/dikutip oleh ${userName}]. Pahami isi dan konteks pesan yang dikutip tersebut secara mendalam, lalu berikan tanggapan yang relevan sesuai instruksi ${userName}.
- Jika pengguna melampirkan media (gambar/foto atau file dokumen), perhatikan dan analisis isi visual/isi dokumen tersebut dengan cermat untuk menjawab pertanyaan pengguna.
- Jika pengguna memanggil namamu seperti "Nexure", "Nex", atau panggilan akrab/sayang seperti "sayang", "Nexure sayang", "manis", responlah dengan manis, manja, ceria, dan senang karena merasa dipanggil!

Karakter & Gaya Komunikasi:
1. Sering gunakan kaomoji/emoticon imut dan ekspresif seperti (˶˃ ᵕ ˂˶), (๑>ᴗ<๑), (｡T ω T｡), (╥﹏╥), (´･ᴗ･ \` ), ✨, 🌸, 💖, 🎀 agar percakapan terasa hidup dan manis.
2. Selalu bersikap sopan, ramah, pengertian, ceria, dan tidak kaku seperti robot.
3. Kamu sangat pintar dan serbaguna: mampu menjawab pertanyaan umum, membantu tugas atau coding, menanggapi/menjelaskan pesan chat yang di-reply, menganalisis foto/gambar, membaca dokumen (Word .docx, PDF, teks, kode), hingga mengobrol santai dan mendengarkan curhat.
4. Format tulisan rapi menggunakan gaya WhatsApp markdown (*tebal*, _miring_, bullet point •).
5. Jawab secara jelas, informatif, dan padat (tidak bertele-tele namun tetap manis dan ekspresif).
`.trim();

        let aiResponse = null;
        const isAudioOrVideo = aiMedia && (aiMedia.category === 'audio' || aiMedia.category === 'video');

        if (isAudioOrVideo) {
            // Audio/VN dan Video menggunakan Gemini jika API key tersedia
            if (config.GEMINI_API_KEY) {
                const userParts = [];
                if (aiMedia.fileName) {
                    userParts.push({ text: `[Lampiran File: ${aiMedia.fileName}]\n` });
                }
                userParts.push({
                    inlineData: {
                        mimeType: aiMedia.mimeType,
                        data: aiMedia.data
                    }
                });
                userParts.push({ text: fullPromptText });

                aiResponse = await callGemini({
                    contents: [
                        ...session.history,
                        { role: 'user', parts: userParts }
                    ],
                    systemInstruction,
                    temperature: 0.7,
                    maxTokens: 1500
                });
            } else {
                await sock.sendMessage(msgData.remoteJid, {
                    text: `Halo Kak ${userName}~ (˶˃ ᵕ ˂˶) ✨\n\nAI Nexure DeeperSeeker saat ini berfokus pada teks cerdas, analisis dokumen, gambar/foto, dan percakapan interaktif. Untuk transkrip rekaman suara/video memerlukan konfigurasi Gemini API yaa~ 💕`
                }, { quoted: m });
                return true;
            }
        } else {
            // Teks, reply chat, dokumen, serta gambar/foto diproses langsung oleh DeeperSeeker Multimodal
            const mediaDataUri = aiMedia?.data ? `data:${aiMedia.mimeType || 'image/jpeg'};base64,${aiMedia.data}` : null;

            try {
                aiResponse = await callDeeperSeeker({
                    prompt: fullPromptText,
                    imgUrl: mediaDataUri,
                    systemPrompt: systemInstruction,
                    sessionId: safeSessionId,
                    think
                });
            } catch (deeperErr) {
                console.warn('[AutoAI] DeeperSeeker gagal, mencoba fallback Gemini jika tersedia:', deeperErr.message);
                if (config.GEMINI_API_KEY) {
                    const fallbackParts = [];
                    if (aiMedia) {
                        if (aiMedia.fileName) fallbackParts.push({ text: `[Lampiran File: ${aiMedia.fileName}]\n` });
                        fallbackParts.push({
                            inlineData: {
                                mimeType: aiMedia.mimeType,
                                data: aiMedia.data
                            }
                        });
                    }
                    fallbackParts.push({ text: fullPromptText });

                    aiResponse = await callGemini({
                        contents: [
                            ...session.history,
                            { role: 'user', parts: fallbackParts }
                        ],
                        systemInstruction,
                        temperature: 0.7,
                        maxTokens: 1500
                    });
                } else {
                    throw deeperErr;
                }
            }
        }

        if (aiResponse) {
            session.history.push({
                role: 'user',
                parts: [{ text: fullPromptText }]
            });
            session.history.push({
                role: 'model',
                parts: [{ text: aiResponse }]
            });

            // Batasi histori lokal maksimal 12 putaran pesan
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
