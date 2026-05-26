import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';

// Fetch video with quality fallback (tries 1080p first, cascades down)
async function fetchVideoWithFallback(videoUrl, preferredQuality = '1080') {
    const qualityChain = preferredQuality === '1080'
        ? ['1080', '720', '480', '360', '240']
        : [preferredQuality, '720', '480', '360', '240'];

    let lastError = null;

    try {
        // Fetch once to get all available formats
        const apiUrl = `${config.API_AMMARICANO}/api/download/youtube?url=${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
            }
        });

        if (!data || !data.result) {
            throw new Error('Response API tidak valid');
        }

        const result = data.result;
        const videoFormats = result.formats?.video || [];

        // Try each quality in chain
        for (const quality of qualityChain) {
            const qualityStr = quality + 'p'; // Convert 1080 to 1080p
            const format = videoFormats.find(f => f.quality === qualityStr);

            if (format && format.url && format.url.startsWith('http')) {
                return {
                    data: result,
                    videoUrl: format.url,
                    usedQuality: quality,
                    videoData: { ...result, url: format.url, quality }
                };
            }
        }

        // If no specific quality found, try muxed formats (best for quality)
        const muxedFormats = result.formats?.muxed || [];
        if (muxedFormats.length > 0) {
            const bestMuxed = muxedFormats[0]; // Usually highest quality first
            return {
                data: result,
                videoUrl: bestMuxed.url,
                usedQuality: 'best-muxed',
                videoData: { ...result, url: bestMuxed.url, quality: 'Muxed' }
            };
        }

        throw new Error('Tidak ada format video yang ditemukan');
    } catch (err) {
        throw err.message || err;
    }
}

export default {
    command: ['ytmp4', 'ytvideo', 'ytv'],
    category: 'downloader',
    isRegistered: true,
    limit: 5,
    description: 'Mengunduh video dari YouTube dengan pilihan resolusi.',
    async execute(sock, m, msgData) {
        if (!msgData.args[0]) {
            return msgData.reply(`Umm... Kakak lupa masukkan link YouTube-nya ya? Ketik .${msgData.commandName} <url> [resolusi] yaa~ (˶˃ ᵕ ˂˶)`);
        }

        const videoUrl = msgData.args[0];
        const preferredQuality = msgData.args[1] || '1080';

        await msgData.react('🕓');

        try {
            const { videoUrl: downloadUrl, usedQuality, videoData } = await fetchVideoWithFallback(videoUrl, preferredQuality);

            if (!downloadUrl || !downloadUrl.startsWith('http')) {
                throw new Error('Yahhh... URL video tidak valid (╥﹏╥)');
            }

            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const safeTitle = (videoData.title || 'video').replace(/[\\/:*?"<>|]/g, '').slice(0, 50);
            const filenameId = `${Date.now()}`;
            const filePath = path.join(tmpDir, `${filenameId}.mp4`);
            const fixedFilePath = path.join(tmpDir, `${filenameId}_fixed.mp4`);

            // Download video stream to tmp
            const writer = fs.createWriteStream(filePath);
            const downloadResponse = await axios({
                url: downloadUrl,
                method: 'GET',
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                }
            });

            downloadResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await new Promise((resolve) => {
                const scaleHeight = usedQuality.toString().replace(/p/gi, '');
                const ffmpegCmd = `ffmpeg -y -i "${filePath}" -c:v libx264 -preset ultrafast -crf 38 -vf "scale=-2:${scaleHeight}" -pix_fmt yuv420p -profile:v baseline -level 3.0 -c:a copy -movflags +faststart "${fixedFilePath}"`;

                exec(ffmpegCmd, (err) => {
                    if (err) {
                        console.error('FFMPEG Error:', err);
                        // Jika ffmpeg gagal, tetap coba gunakan file asli sebagai fallback
                        fs.copyFileSync(filePath, fixedFilePath);
                        resolve();
                    } else {
                        resolve();
                    }
                });
            });

            // Fetch thumbnail for adReply
            /* let thumbBuffer = null;
            if (videoData.thumbnail) {
                try {
                    const res = await axios.get(videoData.thumbnail, { responseType: 'arraybuffer' });
                    thumbBuffer = Buffer.from(res.data);
                } catch (e) {
                    console.error('Failed to fetch thumbnail:', e.message);
                }
            } */

            const caption = `Ini videonya buat Kakak~! @${msgData.senderJid.split('@')[0]} (๑>ᴗ<๑)\n\n` +
                `🎥 *Title:* ${videoData.title}\n` +
                `👤 *Author:* ${videoData.channel || 'Unknown'}\n` +
                `⏳ *Duration:* ${videoData.length_seconds || videoData.lengthSeconds}\n` +
                `📺 *Quality:* ${videoData.quality || usedQuality}\n` +
                `👀 *Views:* ${videoData.view_count || videoData.views || 'N/A'}\n` +
                `📅 *Uploaded:* ${videoData.upload_date || videoData.uploadDate || 'N/A'}\n\n` +
                `Nexure sudah perbaiki videonya agar lancar diputar di WA Kakak~ ✨`;

            await sock.sendMessage(msgData.remoteJid, {
                video: { url: fixedFilePath },
                mimetype: 'video/mp4',
                fileName: `${safeTitle}.mp4`,
                caption: caption,
                mentions: [msgData.senderJid],
                /* contextInfo: {
                    externalAdReply: {
                        title: data.title,
                        body: 'Nexure YouTube Downloader',
                        mediaType: 2,
                        sourceUrl: data.videoUrl,
                        thumbnail: thumbBuffer
                    }
                } */
            }, { quoted: m });

            // Cleanup files
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(fixedFilePath)) fs.unlinkSync(fixedFilePath);

            await msgData.react('✅');

        } catch (error) {
            console.error('YTMP4 Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await msgData.reply(`Uwaaa gawat! Nexure gagal unduh videonya: ${errMsg}.. (╥﹏╥)`);
        }
    }
};
