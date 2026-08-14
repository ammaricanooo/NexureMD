const plugin = {
    command: ['gc-open'],
    category: 'group',
    description: 'Membuka grup (Semua orang bisa chat).',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            await sock.groupSettingUpdate(msgData.remoteJid, 'not_announcement');
            await msgData.react('✅');
            await msgData.reply('✅ Selesai kak! Grup berhasil *dibuka kembali*. Sekarang seluruh anggota bebas mengirim pesan lagi~ (˶˃ ᵕ ˂˶)');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Nexure gagal membuka grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
