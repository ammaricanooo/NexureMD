import ApiKey from '../../databases/orm/ApiKey.js';

export default {
    command: ['confirmdelete'],
    category: 'owner',
    isOwner: true,
    description: '✅ Konfirmasi penghapusan API Key',
    async execute(sock, m, msgData) {
        const { args } = msgData;

        if (args.length === 0) {
            return m.reply('❌ Gunakan: *.confirmdelete <nama>');
        }

        try {
            const keyName = args.join(' ');

            // Cek apakah ada pending delete
            if (!global.pendingDelete || !global.pendingDelete[keyName]) {
                return m.reply('❌ Tidak ada pending delete untuk key ini. Jalankan *.deleteapikey dulu!');
            }

            const pending = global.pendingDelete[keyName];

            // Validasi owner
            if (pending.ownerNumber !== m.sender) {
                return m.reply('❌ Hanya owner yang membuat pending delete yang bisa konfirmasi!');
            }

            // Validasi timeout (5 menit)
            if (Date.now() - pending.timestamp > 300000) {
                delete global.pendingDelete[keyName];
                return m.reply('❌ Sesi delete telah expired. Jalankan *.deleteapikey lagi!');
            }

            // Hapus dari database
            await ApiKey.destroy({
                where: { id: pending.apiKeyId }
            });

            // Hapus dari pending
            delete global.pendingDelete[keyName];

            return m.reply(`
✅ *API Key Berhasil Dihapus!*

Nama: ${keyName}

Key ini tidak bisa digunakan lagi pada API Gateway.
`.trim());
        } catch (error) {
            console.error('Confirm Delete Error:', error);
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
};
