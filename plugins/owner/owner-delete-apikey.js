import ApiKey from '../../databases/orm/ApiKey.js';

export const command = {
    name: 'deleteapikey',
    type: 'owner',
    description: '🗑️ Hapus API Key yang sudah tidak diperlukan',
    example: [
        '*.deleteapikey <nama>',
        '*.deleteapikey Web Platform',
        '*.deleteapikey Mobile App'
    ]
};

export async function handler(m, { args, isOwner }) {
    if (!isOwner) {
        return m.reply('❌ Hanya Owner yang bisa hapus API Key!');
    }

    if (args.length === 0) {
        return m.reply(`
🗑️ *Hapus API Key*

Gunakan: *.deleteapikey <nama>

Contoh:
*.deleteapikey Web Platform

⚠️ Tindakan ini TIDAK BISA DIBATALKAN!
`.trim());
    }

    try {
        const keyName = args.join(' ');

        // Cari API Key
        const apiKey = await ApiKey.findOne({
            where: {
                name: keyName,
                owner_number: m.sender
            }
        });

        if (!apiKey) {
            return m.reply(`❌ API Key dengan nama "${keyName}" tidak ditemukan!`);
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
            ownerNumber: m.sender,
            timestamp: Date.now()
        };

        // Auto-clear setelah 30 detik
        setTimeout(() => {
            delete global.pendingDelete?.[keyName];
        }, 30000);

        return m.reply(response);
    } catch (error) {
        console.error('Delete API Key Error:', error);
        return m.reply(`❌ Error: ${error.message}`);
    }
}
