import ApiKey from '../../databases/orm/ApiKey.js';

export default {
    command: ['activeapikey'],
    category: 'owner',
    isOwner: true,
    description: '✅ Aktifkan API Key yang sudah nonaktif',
    async execute(sock, m, msgData) {
        const { args, senderJid, remoteJid } = msgData;

        if (args.length === 0) {
            return sock.sendMessage(remoteJid, { text: `
✅ *Aktifkan API Key*

Gunakan: *.activeapikey <nama>

Contoh:
*.activeapikey Web Platform
`.trim() });
        }

        try {
            const keyName = args.join(' ');

            // Cari dan update API Key
            const [updated] = await ApiKey.update(
                { is_active: true },
                {
                    where: {
                        name: keyName,
                        owner_number: senderJid
                    }
                }
            );

            if (updated === 0) {
                return sock.sendMessage(remoteJid, { text: `❌ API Key dengan nama "${keyName}" tidak ditemukan!` });
            }

            return sock.sendMessage(remoteJid, { text: `
✅ *API Key Diaktifkan*

Nama: ${keyName}

Status: ✅ ACTIVE
Key sudah bisa digunakan pada API Gateway.
`.trim() });
        } catch (error) {
            console.error('Active API Key Error:', error);
            return sock.sendMessage(remoteJid, { text: `❌ Error: ${error.message}` });
        }
    }
};
