// Don't delete this credit!!!
// Script by ShirokamiRyzen

import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import config from '../../config.js';

export default {
    command: ['instagram', 'ig', 'igdl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh video, gambar, atau audio dari Instagram.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Kakak lupa masukin link Instagram-nya yaa? Pakainya gini: .${msgData.commandName} <url> kakak~ (˶˃ ᵕ ˂˶)` }, { quoted: m });
        }

        const url = msgData.args[0];
        const withAudio = msgData.messageContent.includes('--with-audio'); // Mendukung flag --with-audio

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const { data } = await axios.get(`${config.API_AMMARICANO}/api/download/instagram?url=${encodeURIComponent(url)}`);

            if (!data.success || !data.result) {
                throw new Error('Yahhh, media Instagram-nya nggak ketemu atau link-nya bermasalah kak~ (╥﹏╥)');
            }

            const result = data.result;
            const videos = Array.isArray(result.video)
                ? result.video.map(item => ({ type: 'video', url: item?.url || item }))
                : [];
            const images = Array.isArray(result.image)
                ? result.image.map(item => ({ type: 'image', url: item?.url || item }))
                : [];
            const audios = Array.isArray(result.audio)
                ? result.audio.map(item => ({ type: 'audio', url: item?.url || item, mimetype: item?.mimetype }))
                : [];

            let allMedia = [...videos, ...images];
            if (withAudio) {
                allMedia = [...allMedia, ...audios];
            }

            if (allMedia.length === 0) {
                throw new Error('Waaa, nggak ada media yang bisa aku ambil dari sini~ (｡T ω T｡)');
            }

            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
            };

            let first = true;
            for (const item of allMedia) {
                const caption = (first && item.type !== 'audio')
                    ? (result.title || `Ini dia pesanan kakak @${msgData.senderJid.split('@')[0]}~ Spesial buat kakak! (๑>ᴗ<๑)`)
                    : '';
                const mediaUrl = item.url;

                try {
                    if (!mediaUrl) {
                        throw new Error('URL media tidak tersedia');
                    }

                    const res = await axios.get(mediaUrl, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers
                    });
                    const buffer = Buffer.from(res.data);

                    if (item.type === 'video') {
                        await sock.sendMessage(msgData.remoteJid, {
                            video: buffer,
                            mimetype: 'video/mp4',
                            fileName: 'video.mp4',
                            caption: caption,
                            mentions: [msgData.senderJid],
                        }, { quoted: m });
                    } else if (item.type === 'image') {
                        await sock.sendMessage(msgData.remoteJid, {
                            image: buffer,
                            caption: caption,
                            mentions: [msgData.senderJid],
                        }, { quoted: m });
                    } else if (item.type === 'audio') {
                        await sock.sendMessage(msgData.remoteJid, {
                            audio: buffer,
                            mimetype: item.mimetype || 'audio/mpeg',
                            fileName: 'audio.mp3',
                            caption: caption,
                        }, { quoted: m });
                    }
                } catch (e) {
                    console.error('Error sending media item:', e);
                }

                if (item.type !== 'audio') first = false;
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Instagram Downloader Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });

            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Gomenasai kak! Ada error: ${errMsg}.. Coba cek lagi yaa~ (⊙_⊙)` }, { quoted: m });
        }
    }
};
