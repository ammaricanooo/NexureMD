import { executeAiPrompt } from '../../libs/autoai.js';

export default {
    command: ['ai', 'gemini', 'nexure'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Tanya jawab cerdas dengan Nexure AI (Mendukung teks, reply chat, dokumen Word/PDF/Teks, audio/VN, & video)',
    async execute(sock, m, msgData) {
        const text = msgData.args.join(' ').trim();
        const hasMedia = msgData.isMedia || msgData.isQuotedMedia;
        const hasQuotedText = msgData.isQuoted && !!msgData.quotedContent;

        if (!text && !hasMedia && !hasQuotedText) {
            return msgData.reply(
                `Uwaaa! Kakak mau tanya apa sama Nexure? (๑>ᴗ<๑)\n\n` +
                `*Contoh Penggunaan:*\n` +
                `• \`.ai halo siapa kamu?\` (Tanya teks bebas)\n` +
                `• \`.ai tanggapi ini\` (Reply/balas pesan chat orang lain)\n` +
                `• \`.ai rangkum dokumen ini\` (Kirim / reply file Word .docx, PDF, teks, dll)\n` +
                `• \`.ai jelaskan foto ini\` (Kirim / reply gambar/foto)\n` +
                `• \`.ai transkrip rekaman ini\` (Kirim / reply Voice Note/Audio)\n` +
                `• \`.ai rangkum video ini\` (Kirim / reply video)`
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
