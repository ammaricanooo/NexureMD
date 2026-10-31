import axios from 'axios';
import config from '../../config.js';
import { formatMahasiswaDetail } from '../../libs/interactive.js';

export default {
    command: ['pddiktidetail', 'detailmhs', 'mahasiswadetail'],
    category: 'search',
    isRegistered: true,
    limit: 1,
    description: 'Melihat detail data mahasiswa di PDDIKTI berdasarkan ID',
    async execute(sock, m, msgData) {
        const id = msgData.args[0]?.trim();

        if (!id) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Masukkan ID mahasiswanya yaa kak~ (˶˃ ᵕ ˂˶)\n\nContoh: \`.${msgData.commandName} 48exuEVm30SLaXG9h-eTrg... atau cari dulu via \`.pddikti <nama>\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_AMMARICANO}/api/search/pddikti/detail?id=${encodeURIComponent(id)}`;
            const res = await axios.get(url);
            const detail = res.data?.result;

            if (!detail || typeof detail !== 'object') {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Nexure kak, detail mahasiswa dengan ID tersebut nggak ditemukan.. (｡T ω T｡)`
                }, { quoted: m });
            }

            const message = formatMahasiswaDetail(detail);

            await sock.sendMessage(msgData.remoteJid, {
                text: message.trim(),
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('PDDIKTI Detail Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            const errMsg = error.response?.data?.result?.error || error.response?.data?.message || error.message || 'Internal Server Error';
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Nexure gagal ambil detail mahasiswanya kak.. (╥﹏╥)\n\n*Error:* ${errMsg}`
            }, { quoted: m });
        }
    }
};
