import ApiKey from '../../databases/orm/ApiKey.js';

export default {
    command: ['deactiveapikey'],
    category: 'owner',
    isOwner: true,
    description: '❌ Nonaktifkan API Key tanpa menghapusnya',
    async execute(sock, m, msgData) {
        const { args } = msgData;

        if (args.length === 0) {
            return m.reply(`
❌ *Nonaktifkan API Key*

Gunakan: *.deactiveapikey <nama>

Contoh:
*.deactiveapikey Web Platform

⚠️ Key tidak akan dihapus, hanya dinonaktifkan sementara.
Gunakan *.activeapikey untuk mengaktifkan kembali.
`.trim());
        }

        try {
            const keyName = args.join(' ');

            // Cari dan update API Key
            const [updated] = await ApiKey.update(
                { is_active: false },
                {
                    where: {
                        name: keyName,
                        owner_number: m.sender
                    }
                }
            );

            if (updated === 0) {
                return m.reply(`❌ API Key dengan nama "${keyName}" tidak ditemukan!`);
            }

            return m.reply(`
❌ *API Key Dinonaktifkan*

Nama: ${keyName}

Status: ❌ INACTIVE
Key tidak bisa digunakan pada API Gateway.

Untuk mengaktifkan kembali:
*.activeapikey ${keyName}
`.trim());
        } catch (error) {
            console.error('Deactive API Key Error:', error);
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
};
