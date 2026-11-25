import { clearSession } from '../../libs/ai-session-manager.js';

export default {
    command: ['clear', 'aiclear', 'resetai'],
    category: 'tool',
    isRegistered: true,
    description: 'Menghapus riwayat memori percakapan AI Nexure untuk memulai obrolan baru yang segar.',
    async execute(sock, m, msgData) {
        const sessionKey = `${msgData.remoteJid}:${msgData.senderJid}`;
        clearSession(sessionKey);

        await msgData.react('🧹');
        return msgData.reply(
            `Siap kak ${msgData.pushName || 'manis'}~! (˶˃ ᵕ ˂˶) ✨\n\n` +
            `Ingatan percakapan AI Nexure denganmu di chat ini sudah dibersihkan. Yuk kita mulai obrolan baru yang segar! 🌸`
        );
    }
};
