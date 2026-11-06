import { generateWAMessageFromContent } from 'baileys';
import GroupMemberStat from '../../databases/orm/GroupMemberStat.js';

/**
 * Plugin Top Chat Member Grup
 *
 * Fitur:
 * 1. Tracking otomatis jumlah pesan setiap member di grup (via trackMessage)
 * 2. Command .topchat → Tampilkan Top member terbanyak sebagai Poll Result Snapshot (dengan indikator bar hijau, jumlah pesan, dan non-selectable)
 * 3. Command .resetchat → Reset statistik grup (owner only)
 */

// ─── Tracker Pesan (Dipanggil dari setiap pesan masuk di grup) ─────────────
export async function trackMessage(groupJid, memberJid, memberName) {
    if (!groupJid || !memberJid) return;
    if (!groupJid.endsWith('@g.us')) return;
    if (memberJid.endsWith('@g.us') || memberJid === 'status@broadcast') return;

    try {
        // Strip device suffix (misal: 6281234:10@s.whatsapp.net -> 6281234@s.whatsapp.net)
        const cleanJid = memberJid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
        const nameToSave = memberName || cleanJid.split('@')[0];

        // Temukan atau buat record member untuk grup ini
        const [stat, created] = await GroupMemberStat.findOrCreate({
            where: { group_jid: groupJid, member_jid: cleanJid },
            defaults: {
                member_name: nameToSave,
                message_count: 0
            }
        });

        // Increment jumlah pesan + update nama jika ada perubahan pushName
        await stat.increment('message_count', { by: 1 });
        if (memberName && stat.member_name !== memberName) {
            await stat.update({ member_name: memberName });
        }
    } catch (err) {
        console.error('[TopChat] Tracking error:', err.message);
    }
}

// ─── Plugin Definition ─────────────────────────────────────────────────────
const plugin = {
    command: ['topchat', 'top', 'resetchat'],
    category: 'group',
    description: 'Menampilkan top member terbanyak chat di grup sebagai Poll Result Snapshot.',
    isGroup: true,

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

        // ── TOP CHAT (POLL RESULT SNAPSHOT MESSAGE VIA CRM) ─────────────────
        try {
            await msgData.react('⏳');

            // Ambil top 10 member berdasarkan message_count (maks 12 sesuai limit opsi poll WhatsApp)
            const limit = Math.min(parseInt(args[0]) || 10, 12);
            const topMembers = await GroupMemberStat.findAll({
                where: { group_jid: remoteJid },
                order: [['message_count', 'DESC']],
                limit,
            });

            if (!topMembers || topMembers.length === 0) {
                await msgData.react('❌');
                return msgData.reply(
                    '📊 Belum ada data statistik chat untuk grup ini Kak~\n' +
                    'Data akan terekam otomatis setiap ada anggota yang mengirim pesan. (๑>ᴗ<๑)'
                );
            }

            // Total pesan seluruh member di grup
            const totalMessages = topMembers.reduce((sum, item) => sum + item.message_count, 0);

            // Format opsi pollVotes untuk pollResultSnapshotMessage
            const pollVotes = topMembers.map((stat, idx) => {
                const rawName = stat.member_name || stat.member_jid.split('@')[0];
                const cleanName = rawName.replace(/[\r\n]+/g, ' ').trim() || 'Member';
                const shortName = cleanName.length > 25 ? cleanName.slice(0, 23) + '..' : cleanName;
                return {
                    optionName: `${idx + 1}. ${shortName}`,
                    optionVoteCount: stat.message_count
                };
            });

            // Buat pesan pollResultSnapshotMessage menggunakan generateWAMessageFromContent
            // Tampilan: indikator bar hijau terisi, angka jumlah chat di samping kanan, dan non-selectable
            const waMsg = generateWAMessageFromContent(remoteJid, {
                pollResultSnapshotMessage: {
                    name: `📊 TOP ${topMembers.length} MOST ACTIVE MEMBERS\nTotal Chat: ${totalMessages.toLocaleString()} pesan`,
                    pollVotes
                }
            }, {
                userJid: sock.user?.id,
                quoted: m
            });

            // Kirim pesan menggunakan conn.relayMessage (crm)
            await sock.relayMessage(remoteJid, waMsg.message, { messageId: waMsg.key.id });

            await msgData.react('📊');

        } catch (error) {
            console.error('[TopChat Plugin Error]', error);
            await msgData.react('❌');
            await msgData.reply('Gomen ne Kak... Nexure gagal mengirim polling top chat (╥﹏╥)');
        }
    }
};

export default plugin;
