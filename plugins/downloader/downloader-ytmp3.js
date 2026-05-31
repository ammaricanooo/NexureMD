import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import config from '../../config.js';

const streamPipeline = promisify(pipeline);

export default {
    command: ['ytmp3', 'ytaudio', 'yta'],
    category: 'downloader',
    isRegistered: true,
    limit: 3,
    description: 'Mengunduh audio dari YouTube.',

    async execute(sock, m, msgData) {

        if (!msgData.args[0]) {
            return msgData.reply(
                `Duhh Kakak lupa ya?\n\n` +
                `Masukkan link YouTube-nya yaa!\n` +
                `Contoh: .${msgData.commandName} <url>`
            );
        }

        const videoUrl = msgData.args[0];

        await msgData.react('🕓');

        try {

            // ================= API REQUEST =================

            const apiUrl =
                `${config.API_AMMARICANO}/api/download/ytmp3` +
                `?url=${encodeURIComponent(videoUrl)}`;

            const { data } = await axios.get(apiUrl, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            if (
                !data ||
                !data.success ||
                !data.result ||
                !data.result.download ||
                !data.result.download.urlss
            ) {
                throw new Error(
                    'Yahhh... Link audionya nggak ketemu (╥﹏╥)'
                );
            }

            // ================= RESPONSE =================

            const metadata = data.result.metadata;
            const download = data.result.download;

            // ================= TMP =================

            const tmpDir = path.join(process.cwd(), 'tmp');

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const safeTitle = (metadata.title || 'audio')
                .replace(/[\\/:*?"<>|]/g, '')
                .slice(0, 50);

            const filePath = path.join(
                tmpDir,
                `${Date.now()}_${safeTitle}.mp3`
            );

            // ================= DOWNLOAD =================

            const audioResponse = await axios({
                method: 'GET',
                url: download.url,
                responseType: 'stream',
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            await streamPipeline(
                audioResponse.data,
                fs.createWriteStream(filePath)
            );

            // ================= CAPTION =================

            const caption =
                `Ini kak audionya buat Kakak~! ` +
                `@${msgData.senderJid.split('@')[0]} (๑>ᴗ<๑)\n\n` +

                `🎵 *Title:* ${metadata.title}\n` +
                `👤 *Author:* ${metadata.author}\n` +
                `⏳ *Duration:* ${metadata.lengthSeconds} sec\n` +
                `📀 *Format:* ${metadata.quality}\n` +
                `👀 *Views:* ${metadata.views}\n` +
                `📅 *Uploaded:* ${metadata.uploadDate}\n`;

            // ================= SEND =================

            await sock.sendMessage(
                msgData.remoteJid,
                {
                    document: { url: filePath },
                    mimetype: 'audio/mpeg',
                    fileName: `${safeTitle}.mp3`,
                    caption,
                    mentions: [msgData.senderJid]
                },
                { quoted: m }
            );

            // ================= CLEANUP =================

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await msgData.react('✅');

        } catch (error) {

            console.error('YTMP3 Error:', error);

            await msgData.react('❌');

            const errMsg =
                error.response?.data?.message ||
                error.message;

            await msgData.reply(
                `Gawat kak! Gagal unduh audio:\n\n${errMsg}`
            );
        }
    }
};