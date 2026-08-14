const plugin = {
    command: ['gc-unlock'],
    category: 'group',
    description: 'Membuka pengeditan info grup (Semua Orang).',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            await sock.groupSettingUpdate(msgData.remoteJid, 'unlocked');
            await msgData.react('✅');
            await msgData.reply('✅ Selesai kak! Info grup berhasil *dibuka*. Sekarang seluruh anggota bisa mengubah nama & deskripsi grup~ (๑>ᴗ<๑)');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Nexure gagal membuka info grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
