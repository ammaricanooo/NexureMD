const plugin = {
    command: ['gc-lock'],
    category: 'group',
    description: 'Mengunci pengeditan info grup (Hanya Admin).',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            await sock.groupSettingUpdate(msgData.remoteJid, 'locked');
            await msgData.react('✅');
            await msgData.reply('✅ Selesai kak! Info grup berhasil *dikunci*. Sekarang hanya Admin yang bisa mengubah nama & deskripsi grup~ (˶˃ ᵕ ˂˶)');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Nexure gagal mengunci info grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
