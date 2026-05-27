import axios from 'axios';
import fetch from 'node-fetch';
import { imageToWebp, writeExif } from '../../libs/sticker/sticker.js';
import { ryzumiCDN } from '../../libs/uploader.js';

export default {
    command: ['smeme', 'stickermeme'],
    category: 'sticker',
    isRegistered: true,
    description: 'Buat stiker meme dengan teks atas|bawah dari gambar yang dikirim atau dibalas.',
    async execute(sock, m, msgData, user) {
        const { config, args, isQuoted, isQuotedMedia, isMedia, quotedMsg, msg, quotedType, quotedMime, mime, remoteJid } = msgData;

        try {
            const hasMedia = (isQuoted && isQuotedMedia) || isMedia;
            if (!hasMedia) return msgData.reply('Kirim atau balas gambar yang ingin dijadikan meme, tambahkan teks dengan format: atas|bawah');

            const fullText = args.join(' ');
            if (!fullText) return msgData.reply('Tambahkan teks meme dengan format: atas|bawah');

            let [topText, bottomText] = fullText.split('|');
            topText = (topText || '').trim();
            bottomText = (bottomText || '').trim();
            if (!topText) topText = '_';
            if (!bottomText) bottomText = '_';

            await msgData.react('⏳');

            const targetMsg = (isQuoted && isQuotedMedia) ? quotedMsg : msg;
            const type = (isQuoted && isQuotedMedia) ? quotedType : (msg.message || Object.keys(msg)[0]);

            const buffer = await msgData.downloadMedia();
            if (!buffer) throw new Error('Gagal mengunduh media.');

            // Upload ke CDN agar background dapat diakses oleh memegen
            const uploadResult = await ryzumiCDN(buffer);
            let imageUrl = uploadResult?.url || (typeof uploadResult === 'string' ? uploadResult : null);
            if (!imageUrl && uploadResult && typeof uploadResult === 'object') {
                // try common shapes
                imageUrl = uploadResult.url || uploadResult.result || null;
            }
            if (!imageUrl) throw new Error('Gagal mengunggah gambar ke CDN.');

            const encodedTop = encodeURIComponent(topText);
            const encodedBottom = encodeURIComponent(bottomText);
            const encodedBg = encodeURIComponent(imageUrl);

            const memeUrl = `https://api.memegen.link/images/custom/${encodedTop}/${encodedBottom}.png?background=${encodedBg}`;

            const res = await axios.get(memeUrl, { responseType: 'arraybuffer', timeout: 30000 });
            if (!res.headers['content-type']?.includes('image')) throw new Error('API meme gagal mengembalikan gambar.');

            const memeBuffer = Buffer.from(res.data);
            const webpBuffer = await imageToWebp(memeBuffer);
            const exifData = { packName: config.BOT_NAME || 'Ryzumi', packPublish: user.name || 'User' };
            const finalSticker = await writeExif(webpBuffer, exifData);

            await sock.sendMessage(remoteJid, { sticker: finalSticker }, { quoted: m });
            await msgData.react('✅');

        } catch (error) {
            console.error('SMeme Sticker Error:', error);
            await msgData.react('❌');
            await msgData.reply(`Gagal membuat stiker meme: ${error.message}`);
        }
    }
};
