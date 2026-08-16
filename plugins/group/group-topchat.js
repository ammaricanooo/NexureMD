import GroupMemberStat from '../../databases/orm/GroupMemberStat.js';
import { Op } from 'sequelize';

/**
 * Plugin Top Chat Member Grup
 *
 * Fitur:
 * 1. Tracking otomatis jumlah pesan setiap member di grup (via onMessage hook)
 * 2. Command .topchat → Tampilkan Top 8 member terbanyak sebagai poll
 * 3. Command .resetchat → Reset statistik grup (owner only)
 *
 * Poll menampilkan nama + jumlah pesan sebagai opsi,
 * anggota bisa "vote" member favorit mereka sekaligus melihat ranking.
 */

// ─── Tracker Pesan (Dipanggil dari setiap pesan masuk) ─────────────────────
// Increment message_count di DB menggunakan upsert untuk efisiensi
export async function trackMessage(groupJid, memberJid, memberName) {
    if (!groupJid || !memberJid) return;
    // Jangan track jika bukan pesan grup atau pengirimnya status/system
    if (!groupJid.endsWith('@g.us')) return;
    if (memberJid.endsWith('@g.us') || memberJid === 'status@broadcast') return;

    try {
        // Normalize jid: strip device suffix (e.g., 6281234:10@s.whatsapp.net → 6281234@s.whatsapp.net)
        const cleanJid = memberJid.split(':')[0].split('@')[0] + '@s.whatsapp.net';

        await GroupMemberStat.upsert({
            group_jid: groupJid,
            member_jid: cleanJid,
            member_name: memberName || cleanJid.split('@')[0],
            // message_count akan di-increment via sequelize literal di bawah
        });

        // Increment secara atomic untuk menghindari race condition
        await GroupMemberStat.increment('message_count', {
            where: { group_jid: groupJid, member_jid: cleanJid }
        });
    } catch (err) {
        // Jangan crash bot jika tracking gagal
        console.error('[TopChat] Tracking error:', err.message);
    }
}

// ─── Plugin Definition ─────────────────────────────────────────────────────
const plugin = {
    command: ['topchat', 'top', 'resetchat'],
    category: 'group',
    description: 'Menampilkan top member terbanyak chat di grup sebagai poll. | .resetchat untuk reset (owner)',
    isGroup: true,

    // Hook untuk tracking setiap pesan masuk di grup
    // Dipanggil dari messageAdapter sebelum command checking
    onMessage: async (sock, m, msgData) => {
        if (!msgData.isGroup) return;
        // Hanya track pesan biasa (bukan command tracking supaya tetap ringan)
        await trackMessage(msgData.remoteJid, msgData.senderJid, msgData.pushName);
    },

    execute: async (sock, m, msgData) => {
        const { commandName, remoteJid, args } = msgData;

        // ── RESET STATS ─────────────────────────────────────────────────────
        if (commandName === 'resetchat') {
            if (!msgData.user?.isOwner) {
                return msgData.reply('❌ Maaf Kak, hanya *Owner* yang bisa reset statistik chat~ (｡T ω T｡)');
            }

            try {
                const deleted = await GroupMemberStat.destroy({
                    where: { group_jid: remoteJid }
                });
                await msgData.react('🗑️');
                await msgData.reply(
                    `✅ Statistik chat grup berhasil di-reset! (˶˃ ᵕ ˂˶)\n` +
                    `🗑️ Dihapus: *${deleted}* data member.`
                );
            } catch (err) {
                console.error('[TopChat] Reset error:', err);
                await msgData.reply('Gomen Kak... Nexure gagal mereset statistik (╥﹏╥)');
            }
            return;
        }

        // ── TOP CHAT ────────────────────────────────────────────────────────
        try {
            await msgData.react('⏳');

            // Ambil top 8 member berdasarkan message_count
            const limit = Math.min(parseInt(args[0]) || 8, 12); // Max 12 untuk poll WA
            const topMembers = await GroupMemberStat.findAll({
                where: { group_jid: remoteJid },
                order: [['message_count', 'DESC']],
                limit,
            });

            if (!topMembers || topMembers.length === 0) {
                await msgData.react('❌');
                return msgData.reply(
                    '📊 Belum ada data statistik chat untuk grup ini Kak~\n' +
                    'Data akan terekam otomatis setelah ada pesan masuk. (๑>ᴗ<๑)'
                );
            }

            // Total pesan seluruh member di grup untuk persentase
            const totalMessages = topMembers.reduce((sum, m) => sum + m.message_count, 0);

            // Format opsi poll: "🥇 Nama (xxx pesan | xx%)"
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '1️⃣1️⃣', '1️⃣2️⃣'];
            const pollValues = topMembers.map((stat, idx) => {
                const pct = totalMessages > 0 ? ((stat.message_count / totalMessages) * 100).toFixed(1) : '0.0';
                const name = stat.member_name || stat.member_jid.split('@')[0];
                // Potong nama jika terlalu panjang (max 24 char utk WA poll)
                const shortName = name.length > 20 ? name.slice(0, 18) + '..' : name;
                return `${medals[idx] || `${idx + 1}.`} ${shortName} (${stat.message_count} | ${pct}%)`;
            });

            // Kirim sebagai Poll Message
            await sock.sendMessage(remoteJid, {
                poll: {
                    name: `📊 Top ${topMembers.length} Most Active Member`,
                    values: pollValues,
                    selectableCount: 1,     // Hanya bisa pilih 1 opsi
                    toAnnouncementGroup: false
                }
            });

            // Kirim ringkasan teks di bawah poll
            const summaryLines = topMembers.map((stat, idx) => {
                const pct = totalMessages > 0 ? ((stat.message_count / totalMessages) * 100).toFixed(1) : '0.0';
                const name = stat.member_name || stat.member_jid.split('@')[0];
                return `${medals[idx] || `${idx + 1}.`} *${name}*\n   └ ${stat.message_count} pesan (${pct}%)`;
            });

            await msgData.reply(
                `📊 *Top ${topMembers.length} Most Active Chat Member*\n` +
                `👥 Grup ini punya *${totalMessages.toLocaleString()}* total pesan tercatat\n\n` +
                summaryLines.join('\n\n') +
                '\n\n_Vote member favoritmu di poll di atas ya Kak! (˶˃ ᵕ ˂˶)✨_'
            );

            await msgData.react('✅');

        } catch (error) {
            console.error('[TopChat Plugin Error]', error);
            await msgData.react('❌');
            await msgData.reply('Gomen ne Kak... Nexure gagal mengambil data top chat (╥﹏╥)');
        }
    }
};

export default plugin;
