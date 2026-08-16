const DURATION_MAP = {
    '24h': 86400,
    '7d': 604800,
    '30d': 2592000,
};

const DURATION_LABELS = {
    '24h': '24 jam',
    '7d': '7 hari',
    '30d': '30 hari',
};

const plugin = {
    command: ['pin', 'unpin'],
    category: 'group',
    description: 'Pin atau unpin pesan di grup. Reply pesan yang ingin dipin, lalu ketik: .pin [24h/7d/30d]',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,

    execute: async (sock, m, msgData) => {
        const { commandName, args, remoteJid, isQuoted, contextInfo } = msgData;

        if (!isQuoted) {
            return msgData.reply(
                `❌ Reply pesan yang ingin di-*${commandName}* ya Kak~ (｡T ω T｡)\n\n` +
                '*Cara penggunaan:*\n' +
                'Reply pesan → *.pin* [durasi]\n\n' +
                '*Pilihan durasi:*\n' +
                '• *.pin 24h* — Pin selama 24 jam\n' +
                '• *.pin 7d* — Pin selama 7 hari\n' +
                '• *.pin 30d* — Pin selama 30 hari (default)\n\n' +
                '_Untuk unpin: Reply pesan → .unpin_'
            );
        }

        try {
            // Tentukan apakah pesan yang di-reply milik bot sendiri atau user lain
            const botNum = sock.user?.id?.split(':')[0].split('@')[0];
            const participantNum = contextInfo.participant?.split(':')[0].split('@')[0];
            const isFromMe = (participantNum === botNum) || (contextInfo.participant === sock.user?.id);

            // Buat Baileys message key untuk pesan yang di-reply
            const quotedKey = {
                remoteJid,
                fromMe: isFromMe,
                id: contextInfo.stanzaId,
                ...(contextInfo.participant && { participant: contextInfo.participant })
            };

            // ── UNPIN ──────────────────────────────────────────────────────────────
            if (commandName === 'unpin') {
                await sock.sendMessage(remoteJid, {
                    pin: quotedKey,
                    type: 2, // 2 = unpin di Baileys
                    time: 0
                });

                await msgData.react('📌');
                await msgData.reply('✅ Berhasil *unpin* pesan ya Kak! (˶˃ ᵕ ˂˶)');
                return;
            }

            // ── PIN ────────────────────────────────────────────────────────────────
            const durationKey = args[0]?.toLowerCase();
            const duration = DURATION_MAP[durationKey] ?? DURATION_MAP['30d'];
            const durationLabel = DURATION_LABELS[durationKey] ?? DURATION_LABELS['30d'];

            await sock.sendMessage(remoteJid, {
                pin: quotedKey,
                type: 1, // 1 = pin di Baileys
                time: duration
            });

            await msgData.react('📌');
            await msgData.reply(`✅ Berhasil *pin* pesan selama *${durationLabel}* ya Kak! 📌 (˶˃ ᵕ ˂˶)`);

        } catch (error) {
            console.error('[Pin Plugin Error]', error);
            await msgData.reply('Gomen ne Kak... Nexure gagal pin pesannya (╥﹏╥)\nPastikan bot sudah jadi admin ya!');
        }
    }
};

export default plugin;
