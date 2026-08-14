const plugin = {
    command: ['gc-close'],
    category: 'group',
    description: 'Menutup grup (Hanya admin bisa chat).',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            await sock.groupSettingUpdate(msgData.remoteJid, 'announcement');
            await msgData.react('✅');
            await msgData.reply('✅ Selesai kak! Grup berhasil *ditutup*. Sekarang hanya Admin yang bisa mengirim pesan yaa~ (๑>ᴗ<๑)');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Nexure gagal menutup grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
