export default {
    command: ['register', 'daftar'],
    category: 'account',
    description: 'Mendaftarkan diri ke database bot',
    isPrivate: true, // Hanya bisa di chat pribadi
    async execute(sock, m, msgData, user) {
        if (user.is_registered) {
            return msgData.reply('Aduuh kak, kamu sudah terdaftar sebelumnya di database Nexure yaa~ (๑>ᴗ<๑)');
        }

        const name = msgData.args.join(' ') || msgData.pushName || 'User';

        await msgData.db.User.update({ is_registered: true, name: name }, { where: { jid: user.jid } });

        await msgData.react('✅');
        await msgData.reply(`Horeee~! Registrasi berhasil kak! Selamat datang di Nexure-Bot, *${name}*~ (˶˃ ᵕ ˂˶) ✨`);
    }
};

