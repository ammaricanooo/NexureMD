import { executeAiPrompt } from '../../libs/autoai.js';

export default {
    command: ['ai', 'gemini', 'nexure'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Tanya jawab cerdas dengan Nexure AI (Mendukung teks, gambar, & memori sesi)',
    async execute(sock, m, msgData) {
        const text = msgData.args.join(' ').trim();
        const hasMedia = msgData.isMedia || (msgData.isQuoted && msgData.quotedType === 'imageMessage');

        if (!text && !hasMedia) {
            return msgData.reply(
                `Uwaaa! Kakak mau tanya apa sama Nexure? (๑>ᴗ<๑)\n\n` +
                `Contoh:\n` +
                `• \`.ai halo siapa kamu?\`\n` +
                `• \`.ai jelaskan foto ini\` (sambil kirim atau reply gambar yaa~ 🌸)`
            );
        }

        await msgData.react('🕓');

        const success = await executeAiPrompt(sock, m, msgData, {
            promptText: text,
            isDirect: true
        });

        if (success) {
            await msgData.react('✨');
        } else {
            await msgData.react('❌');
        }
    }
};
