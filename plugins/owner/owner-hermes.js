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

        await sock.sendMessage(msgData.remoteJid, { react: { text: '🧠', key: m.key } });

        await sock.sendMessage(msgData.remoteJid, {
            text: `🧠 *Hermes Agent sedang memproses instruksi Anda...*\n\n_Agent sedang bekerja secara otonom di server. Mohon tunggu sebentar._`
        }, { quoted: m });

        const result = await runHermes(prompt);

        if (result.success) {
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

            const output = result.output || 'Tugas telah selesai dijalankan (tanpa output teks).';
            let messageText = `⚡ *HASIL HERMES AGENT* ⚡\n\n${output}`;
            if (messageText.length > 4000) {
                messageText = `⚡ *HASIL HERMES AGENT* ⚡\n\n${output.slice(0, 3800)}\n\n_... (output dipotong karena batasan panjang pesan WhatsApp)_`;
            }

            await sock.sendMessage(msgData.remoteJid, { text: messageText }, { quoted: m });
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
