import { runHermes } from '../../libs/hermes.js';

export default {
    command: ['hermes', 'agent', 'code'],
    category: 'owner',
    isOwner: true,
    description: 'Agentic AI Coding Assistant menggunakan Hermes Agent (Khusus Owner)',
    async execute(sock, m, msgData) {
        const prompt = msgData.args.join(' ').trim();

        if (!prompt) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `🤖 *HERMES AGENTIC CODING* 🤖\n\n` +
                      `Silakan berikan instruksi tugas coding atau server yang ingin dieksekusi oleh Hermes Agent.\n\n` +
                      `*Contoh:* \`.${msgData.commandName} buatkan file test di folder temp dan jalankan dengan node\`\n` +
                      `*Contoh:* \`.${msgData.commandName} periksa error pada routes/search.js dan perbaiki\`\n\n` +
                      `💡 *Tip:* Kakak juga bisa mengaktifkan mode otomatis tanpa command dengan:\n` +
                      `👉 \`.enable agent\` (semua pesan dari Owner langsung diproses Hermes).`
            }, { quoted: m });
        }

        sock.sendPresenceUpdate('composing', msgData.remoteJid).catch(() => {});
        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        const result = await runHermes(prompt);

        if (result.success) {
            await sock.sendMessage(msgData.remoteJid, { react: { text: '', key: m.key } });

            const replyText = result.output || 'Tugas telah selesai dijalankan.';
            await sock.sendMessage(msgData.remoteJid, { text: replyText }, { quoted: m });
        } else {
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });

            let errorResponse = `❌ *Gagal Menjalankan Hermes Agent*\n\n`;
            if (result.isNotFound) {
                errorResponse += `Hermes CLI belum terpasang atau belum masuk PATH di server!\n\n` +
                                 `*Cara Pasang di Server (Linux/VPS):*\n` +
                                 `1. \`curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash\`\n` +
                                 `2. \`source ~/.bashrc\`\n` +
                                 `3. \`hermes setup\`\n\n` +
                                 `Setelah selesai setup, fitur ini siap digunakan langsung dari WhatsApp.`;
            } else {
                errorResponse += `*Detail Error:*\n\`\`\`\n${result.error.slice(0, 1000)}\n\`\`\``;
            }

            await sock.sendMessage(msgData.remoteJid, { text: errorResponse }, { quoted: m });
        }
    }
};
