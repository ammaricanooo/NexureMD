import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['threads', 'threadsdl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh media (gambar/video) dari Threads.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { 
                text: `Kakak manis~ Kasih link Threads-nya dulu dong buat aku download.. (˶˃ ᵕ ˂˶)` 
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const url = msgData.args[0];
            const { data } = await axios.get(`${config.API_AMMARICANO}/api/download/threads?url=${encodeURIComponent(url)}`);

            if (!data.success || !data.result) throw new Error('Gagal mengambil data dari Threads-nya kak~ (╥﹏╥)');

            const result = data.result;

            // Support new API shape: result.image_urls (array of strings) and result.video_urls (array of strings)
            const imageUrls = Array.isArray(result.image_urls) ? result.image_urls : (Array.isArray(result.images) ? result.images : []);
            const videoUrls = Array.isArray(result.video_urls) ? result.video_urls : (Array.isArray(result.videos) ? result.videos : []);

            if (imageUrls.length === 0 && videoUrls.length === 0) {
                throw new Error('Yaaah, nggak ada media yang bisa aku ambil dari Threads itu kak.. (｡T ω T｡)');
            }

            let first = true;

            // Send videos first (if any)
            for (let i = 0; i < videoUrls.length; i++) {
                const vurl = videoUrls[i];
                const caption = first ? `Ini pesanan Threads kakak @${msgData.senderJid.split('@')[0]}~! (๑>ᴗ<๑)\n\n*Caption:* ${result.caption || '-'}` : '';

                await sock.sendMessage(msgData.remoteJid, {
                    video: { url: vurl },
                    caption: caption.trim(),
                    mentions: first ? [msgData.senderJid] : [],
                    mimetype: 'video/mp4'
                }, { quoted: m });

                first = false;
            }

            // Then send images
            for (let i = 0; i < imageUrls.length; i++) {
                const iurl = imageUrls[i];
                const caption = first ? `Ini pesanan Threads kakak @${msgData.senderJid.split('@')[0]}~! (๑>ᴗ<๑)\n\n*Caption:* ${result.caption || '-'}` : '';

                await sock.sendMessage(msgData.remoteJid, {
                    image: { url: iurl },
                    caption: caption.trim(),
                    mentions: first ? [msgData.senderJid] : []
                }, { quoted: m });

                first = false;
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Threads Downloader Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Aduuh gomenasai kak! Ada error pas download Threads: ${errMsg}.. (╥﹏╥)` 
            }, { quoted: m });
        }
    }
};
