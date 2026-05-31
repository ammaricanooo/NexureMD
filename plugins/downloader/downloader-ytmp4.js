import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';

export default {
    command: ['ytmp4', 'ytvideo', 'ytv'],
    category: 'downloader',
    isRegistered: true,
    limit: 5,
    description: 'Mengunduh video dari YouTube dengan pilihan resolusi.',

    async execute(sock, m, msgData) {

        if (!msgData.args[0]) {
            return msgData.reply(
                `Umm... Kakak lupa masukkan link YouTube-nya ya?\n\n` +
                `Ketik .${msgData.commandName} <url> [resolusi] yaa~`
            );
        }

        const videoUrl = msgData.args[0];
        let resolution = msgData.args[1] || '480';

        await msgData.react('🕓');

        try {

            // ================= API REQUEST =================

            const apiUrl =
                `${config.API_AMMARICANO}/api/download/ytmp4` +
                `?url=${encodeURIComponent(videoUrl)}` +
                `&quality=${resolution}`;

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
                !data.result.download.path
            ) {
                throw new Error(
                    'Video tidak ditemukan atau kualitas tidak tersedia'
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

            const safeTitle = (metadata.title || 'video')
                .replace(/[\\/:*?"<>|]/g, '')
                .slice(0, 50);

            const filenameId = `${Date.now()}`;

            const filePath =
                path.join(tmpDir, `${filenameId}.mp4`);

            const fixedFilePath =
                path.join(tmpDir, `${filenameId}_fixed.mp4`);

            // ================= DOWNLOAD =================

            const writer = fs.createWriteStream(filePath);

            const downloadResponse = await axios({
                url: download.url,
                method: 'GET',
                responseType: 'stream',
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            downloadResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // ================= FIX VIDEO =================

            await new Promise((resolve) => {

                const scaleHeight =
                    resolution.toString().replace(/p/gi, '');

                const ffmpegCmd =
                    `ffmpeg -y -i "${filePath}" ` +
                    `-c:v libx264 ` +
                    `-preset ultrafast ` +
                    `-crf 38 ` +
                    `-vf "scale=-2:${scaleHeight}" ` +
                    `-pix_fmt yuv420p ` +
                    `-profile:v baseline ` +
                    `-level 3.0 ` +
                    `-c:a aac ` +
                    `-b:a 128k ` +
                    `-movflags +faststart ` +
                    `"${fixedFilePath}"`;

                exec(ffmpegCmd, (err) => {

                    if (err) {
                        console.error('FFMPEG Error:', err);

                        // fallback
                        fs.copyFileSync(filePath, fixedFilePath);
                    }

                    resolve();
                });
            });

            // ================= CAPTION =================

            const caption =
                `Ini videonya buat Kakak~! ` +
                `@${msgData.senderJid.split('@')[0]} (๑>ᴗ<๑)\n\n` +

                `🎥 *Title:* ${metadata.title}\n` +
                `👤 *Author:* ${metadata.author}\n` +
                `⏳ *Duration:* ${metadata.lengthSeconds}\n` +
                `📺 *Quality:* ${metadata.quality}\n` +
                `👀 *Views:* ${metadata.views}\n` +
                `📅 *Uploaded:* ${metadata.uploadDate}\n\n` +

                `✨ Video sudah diperbaiki agar lancar diputar di WhatsApp`;

            // ================= SEND =================

            await sock.sendMessage(
                msgData.remoteJid,
                {
                    video: { url: fixedFilePath },
                    mimetype: 'video/mp4',
                    fileName: `${safeTitle}.mp4`,
                    caption,
                    mentions: [msgData.senderJid]
                },
                { quoted: m }
            );

            // ================= CLEANUP =================

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            if (fs.existsSync(fixedFilePath)) {
                fs.unlinkSync(fixedFilePath);
            }

            await msgData.react('✅');

        } catch (error) {

            console.error('YTMP4 Error:', error);

            await msgData.react('❌');

            const errMsg =
                error.response?.data?.message ||
                error.message;

            await msgData.reply(
                `Uwaaa gawat! Gagal unduh videonya:\n\n${errMsg}`
            );
        }
    }
};