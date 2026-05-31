import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['nikparser', 'parsenik'],
    category: 'tool',
    isRegistered: true,
    limit: 10,
    description: 'Parsing informasi dari Nomor Induk Kependudukan (NIK).',
    async execute(sock, m, msgData) {
        if (!msgData.args[0]) {
            return msgData.reply(
                `Kakak lupa masukkan NIK-nya yaa!\n\n` +
                `Cara pakai: .${msgData.commandName} <nik>\n` +
                `Contoh: .${msgData.commandName} 3271063010020008`
            );
        }

        const nik = msgData.args[0].trim().replace(/\D/g, '');

        if (nik.length !== 16) {
            return msgData.reply(`NIK harus terdiri dari 16 angka yaa~ (˶˃ ᵕ ˂˶)`);
        }

        await msgData.react('🕓');

        try {
            const { data } = await axios.get(
                `${config.API_AMMARICANO}/api/tools/nik-parser?nik=${nik}`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );

            if (!data?.success || !data?.result) {
                throw new Error('NIK tidak valid atau gagal diparse');
            }

            const result = data.result;

            const caption =
                `🎫 *INFORMASI NIK*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +

                `📋 *NIK:* ${result.nik}\n` +
                `⚧️ *Jenis Kelamin:* ${result.kelamin}\n` +
                `📅 *Tanggal Lahir:* ${result.lahir_lengkap}\n\n` +

                `📍 *LOKASI*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `🏛️ *Provinsi:* ${result.provinsi.nama}\n` +
                `🏙️ *Kota/Kabupaten:* ${result.kotakab.nama} (${result.kotakab.jenis})\n` +
                `🗺️ *Kecamatan:* ${result.kecamatan.nama}\n` +
                `🔢 *Kode Wilayah:* ${result.kode_wilayah}\n\n` +

                `🎂 *INFORMASI TAMBAHAN*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `📆 *Hari Pasaran:* ${result.tambahan.pasaran}\n` +
                `👤 *Usia:* ${result.tambahan.usia}\n` +
                `🎯 *Kategori Usia:* ${result.tambahan.kategori_usia}\n` +
                `🎂 *Ulang Tahun:* ${result.tambahan.ultah}\n` +
                `♈ *Zodiak:* ${result.tambahan.zodiak}\n`;

            await msgData.reply(caption);
            await msgData.react('✅');

        } catch (error) {
            console.error('NIK Parser Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await msgData.reply(`Gamenasai! Gagal parse NIK: ${errMsg}`);
        }
    }
};
