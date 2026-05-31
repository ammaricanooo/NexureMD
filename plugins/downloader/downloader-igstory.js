import axios from 'axios';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';

export default {
    command: ['igstory', 'instagramstory', 'storyig'],
    category: 'downloader',
    isRegistered: true,
    limit: 5,
    description: 'Mengunduh Instagram Story dari username IG.',
    async execute(sock, m, msgData) {
        if (!msgData.args[0]) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Kakak belum memberi username IG. Pakai: .${msgData.commandName} <username> ya~`
            }, { quoted: m });
        }

        let usernameOrUrl = msgData.args[0].trim();
        let storyUrl = usernameOrUrl;

        if (!/^https?:\/\//i.test(usernameOrUrl)) {
            usernameOrUrl = usernameOrUrl.replace(/^@/, '');
            storyUrl = `https://www.instagram.com/stories/${encodeURIComponent(usernameOrUrl)}/`;
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const { data } = await axios.get(`${config.API_AMMARICANO}/api/download/ig-story?url=${encodeURIComponent(storyUrl)}`);

            if (!data?.success || !Array.isArray(data.result) || data.result.length === 0) {
                throw new Error('Waaa, story Instagram-nya nggak ketemu atau tidak bisa diambil kak~ (╥﹏╥)');
            }

            const items = data.result.slice(0, 10);
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            for (let index = 0; index < items.length; index++) {
                const itemUrl = items[index];
                if (!itemUrl) continue;

                try {
                    const response = await axios.get(itemUrl, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                        }
                    });

                    const buffer = Buffer.from(response.data);
                    const contentType = String(response.headers['content-type'] || '').toLowerCase();
                    const caption = index === 0 ? `Ini story IG ${usernameOrUrl} yang berhasil aku ambil buat kakak~` : '';

                    if (contentType.includes('video')) {
                        await sock.sendMessage(msgData.remoteJid, {
                            video: buffer,
                            mimetype: 'video/mp4',
                            fileName: `igstory_${usernameOrUrl}_${index + 1}.mp4`,
                            caption,
                            mentions: [msgData.senderJid]
                        }, { quoted: m });
                    } else if (contentType.includes('image')) {
                        await sock.sendMessage(msgData.remoteJid, {
                            image: buffer,
                            caption,
                            mentions: [msgData.senderJid]
                        }, { quoted: m });
                    } else if (contentType.includes('audio')) {
                        await sock.sendMessage(msgData.remoteJid, {
                            audio: buffer,
                            mimetype: contentType || 'audio/mpeg',
                            fileName: `igstory_${usernameOrUrl}_${index + 1}.mp3`,
                            caption,
                        }, { quoted: m });
                    } else {
                        const fileName = `igstory_${usernameOrUrl}_${index + 1}${path.extname(itemUrl.split('?')[0]) || '.bin'}`;
                        await sock.sendMessage(msgData.remoteJid, {
                            document: buffer,
                            mimetype: contentType || 'application/octet-stream',
                            fileName,
                            caption,
                            mentions: [msgData.senderJid]
                        }, { quoted: m });
                    }
                } catch (innerError) {
                    console.error('IG Story download item error:', innerError);
                }
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('IG Story Downloader Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            const errMsg = error.response?.data?.message || error.message || 'Gagal mengambil story Instagram.';
            await sock.sendMessage(msgData.remoteJid, { text: `Gomenasai kak! ${errMsg}` }, { quoted: m });
        }
    }
};
