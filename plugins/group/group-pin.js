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

        try {
            // ── UNPIN ──────────────────────────────────────────────────────────────
            if (commandName === 'unpin') {
                if (!isQuoted) {
                    return msgData.reply(
                        '❌ Reply pesan yang ingin di-*unpin* ya Kak~ (｡T ω T｡)\n\nCara: Reply pesan → *.unpin*'
                    );
                }

                const quotedKey = {
                    remoteJid,
                    fromMe: contextInfo.quotedMessage?.fromMe ?? false,
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant
                };

                await sock.sendMessage(remoteJid, {
                    pin: {
                        type: 0, // 0 = unpin
                        time: 0,
                        key: quotedKey
                    }
                });

                await msgData.react('📌');
                await msgData.reply('✅ Berhasil *unpin* pesan ya Kak! (˶˃ ᵕ ˂˶)');
                return;
            }

            // ── PIN ────────────────────────────────────────────────────────────────
            if (!isQuoted) {
                return msgData.reply(
                    '❌ Reply pesan yang ingin di-*pin* ya Kak~ (｡T ω T｡)\n\n' +
                    '*Cara penggunaan:*\n' +
                    'Reply pesan → *.pin* [durasi]\n\n' +
                    '*Pilihan durasi:*\n' +
                    '• *.pin 24h* — Pin selama 24 jam\n' +
                    '• *.pin 7d* — Pin selama 7 hari\n' +
                    '• *.pin 30d* — Pin selama 30 hari (default)\n\n' +
                    '_Contoh: reply pesan lalu ketik .pin 7d_'
                );
            }

            // Tentukan durasi dari args[0], default 30d jika tidak diisi
            const durationKey = args[0]?.toLowerCase();
            const duration = DURATION_MAP[durationKey] ?? DURATION_MAP['30d'];
            const durationLabel = DURATION_LABELS[durationKey] ?? DURATION_LABELS['30d'];

            const quotedKey = {
                remoteJid,
                fromMe: contextInfo.quotedMessage?.fromMe ?? false,
                id: contextInfo.stanzaId,
                participant: contextInfo.participant
            };

            await sock.sendMessage(remoteJid, {
                pin: {
                    type: 1, // 1 = pin
                    time: duration,
                    key: quotedKey
                }
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
