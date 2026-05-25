import ApiKey from '../../databases/orm/ApiKey.js';

export const command = {
    name: 'activeapikey',
    type: 'owner',
    description: '✅ Aktifkan API Key yang sudah nonaktif',
    example: [
        '*.activeapikey <nama>',
        '*.activeapikey Web Platform'
    ]
};

export async function handler(m, { args, isOwner }) {
    if (!isOwner) {
        return m.reply('❌ Hanya Owner yang bisa manage API Key!');
    }

    if (args.length === 0) {
        return m.reply(`
✅ *Aktifkan API Key*

Gunakan: *.activeapikey <nama>

Contoh:
*.activeapikey Web Platform
`.trim());
    }

    try {
        const keyName = args.join(' ');

        // Cari dan update API Key
        const [updated] = await ApiKey.update(
            { is_active: true },
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
✅ *API Key Diaktifkan*

Nama: ${keyName}

Status: ✅ ACTIVE
Key sudah bisa digunakan pada API Gateway.
`.trim());
    } catch (error) {
        console.error('Active API Key Error:', error);
        return m.reply(`❌ Error: ${error.message}`);
    }
}
