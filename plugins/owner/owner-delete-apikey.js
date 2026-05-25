import ApiKey from '../../databases/orm/ApiKey.js';

export default {
    command: ['deleteapikey'],
    category: 'owner',
    isOwner: true,
    description: '🗑️ Hapus API Key yang sudah tidak diperlukan',
    async execute(sock, m, msgData) {
        const { args, senderJid, remoteJid } = msgData;

        if (args.length === 0) {
            return sock.sendMessage(remoteJid, { text: `
🗑️ *Hapus API Key*

Gunakan: *.deleteapikey <nama>

Contoh:
*.deleteapikey Web Platform

⚠️ Tindakan ini TIDAK BISA DIBATALKAN!
`.trim() });
        }

        try {
            const keyName = args.join(' ');

            // Cari API Key
            const apiKey = await ApiKey.findOne({
                where: {
                    name: keyName,
                    owner_number: senderJid
                }
            });

            if (!apiKey) {
                return sock.sendMessage(remoteJid, { text: `❌ API Key dengan nama "${keyName}" tidak ditemukan!` });
            }

            // Minta konfirmasi
            const response = `
⚠️ *Konfirmasi Hapus API Key*

Nama: ${apiKey.name}
Prefix: ${apiKey.key_prefix}...xxx

Ketik: *.confirmdelete ${keyName}

Untuk membatalkan, tunggu 30 detik atau ketik command lain.
`.trim();

            // Simpan pending delete di memory (simple approach)
            global.pendingDelete = global.pendingDelete || {};
            global.pendingDelete[keyName] = {
                apiKeyId: apiKey.id,
                ownerNumber: senderJid,
                timestamp: Date.now()
            };

            // Auto-clear setelah 30 detik
            setTimeout(() => {
                delete global.pendingDelete?.[keyName];
            }, 30000);

            return sock.sendMessage(remoteJid, { text: response });
        } catch (error) {
            console.error('Delete API Key Error:', error);
            return sock.sendMessage(remoteJid, { text: `❌ Error: ${error.message}` });
        }
    }
};
