import ApiKey from '../../databases/orm/ApiKey.js';
import { Op } from 'sequelize';

export default {
    command: ['listapikey'],
    category: 'owner',
    isOwner: true,
    description: '🔐 Lihat daftar semua API Key yang sudah dibuat',
    async execute(sock, m, msgData) {
        const { args } = msgData;

        try {
            let filter = {};
            let filterLabel = '';

            // Filter berdasarkan status
            if (args[0]) {
                if (args[0].toLowerCase() === 'active') {
                    filter = { is_active: true };
                    filterLabel = ' (Active)';
                } else if (args[0].toLowerCase() === 'inactive') {
                    filter = { is_active: false };
                    filterLabel = ' (Inactive)';
                }
            }

            // Ambil semua API Key milik owner ini
            const apiKeys = await ApiKey.findAll({
                where: {
                    owner_number: m.sender,
                    ...filter
                },
                order: [['createdAt', 'DESC']],
                raw: true
            });

            // Jika tidak ada
            if (apiKeys.length === 0) {
                return m.reply(`
🔐 *Daftar API Key${filterLabel}*

Belum ada API Key.

Buat API Key baru dengan:
*.createapikey <nama>
`.trim());
            }

            // Format tabel
            let tableStr = '🔐 *Daftar API Key' + filterLabel + '*\n\n';
            tableStr += '╔════════════════════════════════════════╗\n';

            apiKeys.forEach((key, index) => {
                const status = key.is_active ? '✅' : '❌';
                const createdDate = new Date(key.createdAt).toLocaleDateString('id-ID');
                const lastUsed = key.last_used ? new Date(key.last_used).toLocaleDateString('id-ID') : 'Belum';

                tableStr += `║ ${index + 1}. ${key.name}\n`;
                tableStr += `║    ${status} ${key.key_prefix}...xxx\n`;
                tableStr += `║    Dibuat: ${createdDate}\n`;
                tableStr += `║    Akses: ${key.request_count}x\n`;
                tableStr += `║    Terakhir: ${lastUsed}\n`;
                tableStr += '║\n';
            });

            tableStr += '╚════════════════════════════════════════╝\n\n';
            tableStr += `Total: ${apiKeys.length} API Key\n\n`;
            tableStr += `📋 *Opsi:*
*.createapikey <nama>  - Buat API Key baru
*.deleteapikey <nama>  - Hapus API Key
*.activeapikey <nama>  - Aktifkan API Key
*.deactiveapikey <nama> - Nonaktifkan API Key`;

            return m.reply(tableStr);
        } catch (error) {
            console.error('List API Key Error:', error);
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
};
