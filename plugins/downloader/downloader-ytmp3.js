import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import config from '../../config.js';

const streamPipeline = promisify(pipeline);

// Choose the best available audio-only format URL from API response
function selectBestAudioUrl(apiData) {
    const res = apiData?.result || apiData;

    // Try multiple known shapes
    const formats = res?.formats || res?.formats?.audio || res?.audio || null;

    // If there's a dedicated audio array
    const audioArray = Array.isArray(res?.formats?.audio)
        ? res.formats.audio
        : Array.isArray(res?.audio)
            ? res.audio
            : Array.isArray(res?.formats)
                ? // attempt to filter audio-only entries from mixed formats
                  res.formats.filter(f => f.has_audio && !f.has_video)
                : null;

    if (audioArray && audioArray.length > 0) {
        // Prefer highest bitrate, fallback to content_length
        const sorted = audioArray.slice().sort((a, b) => {
            const aBit = Number(a.bitrate || a.avg_bitrate || 0);
            const bBit = Number(b.bitrate || b.avg_bitrate || 0);
            if (bBit !== aBit) return bBit - aBit;
            const aLen = Number(a.content_length || 0);
            const bLen = Number(b.content_length || 0);
            return bLen - aLen;
        });
        return sorted[0].url || sorted[0].url_simple || sorted[0].downloadUrl || null;
    }

    // Fallbacks: some APIs return direct url or result.url
    if (res?.url) return res.url;
    if (apiData?.url) return apiData.url;

    return null;
}

export default {
    command: ['ytmp3', 'ytaudio', 'yta'],
    category: 'downloader',
    isRegistered: true,
    limit: 3,
    description: 'Mengunduh audio dari YouTube.',
    async execute(sock, m, msgData) {
        if (!msgData.args[0]) {
            return msgData.reply(`Duhh Kakak lupa ya? Masukkan link YouTube-nya yaa! Contoh: .${msgData.commandName} <url> (˶˃ ᵕ ˂˶)`);
        }

        const videoUrl = msgData.args[0];
        await msgData.react('🕓');

        try {
            const { data } = await axios.get(`${config.API_AMMARICANO}/api/download/youtube?url=${encodeURIComponent(videoUrl)}`);

            // Determine main payload container
            const res = data?.result || data;
            if (!res) throw new Error('Yahhh... Response dari server tidak valid (╥﹏╥)');

            const { title, channel } = res;
            const lengthSeconds = res.lengthSeconds || res.length_seconds || res.video_details?.length_seconds || res.duration || 0;
            const views = res.views || res.view_count || res.video_details?.view_count || 0;
            const uploadDate = res.uploadDate || res.upload_date || res.video_details?.upload_date || '';
            const thumbnail = res.thumbnail || res.thumbnails?.[0]?.url || res.video_details?.thumbnail || '';
            const safeTitle = (title || 'audio').replace(/[\\/:*?"<>|]/g, '').slice(0, 50);
            const tmpDir = path.join(process.cwd(), 'tmp');

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const filePath = path.join(tmpDir, `${Date.now()}_${safeTitle}.mp3`);

            // Select best audio URL and download
            const audioUrl = selectBestAudioUrl(data);
            if (!audioUrl) throw new Error('Yahhh... URL audio berkualitas tidak ditemukan di response (╥﹏╥)');

            const audioResponse = await axios({
                method: 'get',
                url: audioUrl,
                responseType: 'stream'
            });

            await streamPipeline(audioResponse.data, fs.createWriteStream(filePath));

            // Fetch thumbnail for adReply
            /* let thumbBuffer = null;
            if (thumbnail) {
                try {
                    const res = await axios.get(thumbnail, { responseType: 'arraybuffer' });
                    thumbBuffer = Buffer.from(res.data);
                } catch (e) {
                    console.error('Failed to fetch thumbnail:', e.message);
                }
            } */

            const caption = `Ini kak audionya buat Kakak~! @${msgData.senderJid.split('@')[0]} (๑>ᴗ<๑)\n\n` +
                `🎵 *Title:* ${title}\n` +
                `👤 *Author:* ${channel}\n` +
                `⏳ *Duration:* ${lengthSeconds} sec\n` +
                `👀 *Views:* ${views}\n` +
                `📅 *Uploaded:* ${uploadDate}\n\n`;

            // Kirim file audio sebagai dokumen
            await sock.sendMessage(msgData.remoteJid, {
                document: { url: filePath },
                mimetype: 'audio/mpeg',
                fileName: `${safeTitle}.mp3`,
                caption: caption,
                mentions: [msgData.senderJid],
                /* contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: 'Nexure YouTube Downloader',
                        mediaType: 2,
                        sourceUrl: videoUrl,
                        thumbnail: thumbBuffer
                    }
                } */
            }, { quoted: m });

            // Hapus file sementara
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await msgData.react('✅');

        } catch (error) {
            console.error('YTMP3 Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await msgData.reply(`Gawat kak! Gagal unduh audio: ${errMsg}.. (╥﹏╥)`);
        }
    }
};
