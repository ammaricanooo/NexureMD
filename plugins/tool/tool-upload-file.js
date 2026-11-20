import { ammaricanoCDN } from '../../libs/uploader.js';

export default {
    command: ['upload', 'cdn', 'tourl'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Mengunggah berkas ke Ammaricano CDN untuk mendapatkan tautan (URL).',
    async execute(sock, m, msgData) {
        const buffer = await msgData.downloadMedia();

        if (!buffer) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Kakak manis~ (˶˃ ᵕ ˂˶) Kirim atau balas berkas apa saja (gambar/video/audio/dokumen/stiker) dengan perintah *.upload* biar Nexure buatkan link-nya yaa! (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const result = await ammaricanoCDN(buffer);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

            const resData = result.result || result;
            const sizeStr = resData.size ? `${(resData.size / 1024).toFixed(2)} KB (${resData.size.toLocaleString()} bytes)` : 'Misterius';

            const responseText = `Horeee~! Berkas kakak sudah berhasil diunggah ke Ammaricano CDN~! (˶˃ ᵕ ˂˶)\n\n` +
                `*Link:* ${resData.url}\n` +
                `*Nama File:* ${resData.name || '-'}\n` +
                `*Nama Asli:* ${resData.original || 'file'}\n` +
                `*Tipe:* ${resData.type || '-'}\n` +
                `*Ukuran:* ${sizeStr} (๑>ᴗ<๑)\n` +
                `*Creator:* ${result.creator || 'Nexure Network'}`;

            await sock.sendMessage(msgData.remoteJid, { text: responseText }, { quoted: m });

        } catch (error) {
            console.error('Upload Tool Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Aduuh gawat! Nexure gagal mengunggah berkasnya kak: ${error.message}.. (╥﹏╥)`
            }, { quoted: m });
        }
    }
};
