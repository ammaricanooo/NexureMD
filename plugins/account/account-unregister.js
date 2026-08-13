export default {
    command: ['unregister', 'unreg'],
    category: 'account',
    description: 'Menghapus pendaftaran diri dari database bot',
    isPrivate: true,
    async execute(sock, m, msgData, user) {
        if (!user.is_registered) {
            return msgData.reply('Aduuh kak, kamu belum terdaftar sebelumnya di database Nexure.. (╥﹏╥)');
        }

        await msgData.db.User.update({ is_registered: false }, { where: { jid: user.jid } });
        await msgData.react('✅');
        await msgData.reply('Pendaftaran kamu berhasil dihapus dari database Nexure yaa kak~ Sampai jumpa lagi! (｡T ω T｡)');
    }
};

