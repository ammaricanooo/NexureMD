import Setting from '../../databases/orm/Setting.js';
import config from '../../config.js';

export default {
    command: ['enable', 'disable', 'on', 'off'],
    category: 'misc',
    description: 'Mengaktifkan atau menonaktifkan fitur bot',
    async execute(sock, m, msgData, user, group) {
        const availableFeatures = ['welcome', 'limit', 'public', 'register', 'gconly', 'autoai'];
        const feature = msgData.args[0]?.toLowerCase();
        const action = msgData.commandName;
        const status = (action === 'enable' || action === 'on');

        if (!feature || !availableFeatures.includes(feature)) {
            let text = `Uwaaa! Kakak mau atur fitur apa? (๑>ᴗ<๑)\n\n` +
                `*Penggunaan:* \`.${action} <fitur>\`\n\n` +
                `*Daftar fitur:*\n`;
            availableFeatures.forEach(f => {
                text += `• *${f}*\n`;
            });
            return msgData.reply(text.trim());
        }

        // Fitur khusus Global (Owner Only)
        if (['public', 'register', 'gconly'].includes(feature)) {
            if (!user.isOwner) {
                return msgData.reply(
                    config.RYZUMI_MSG_OWNER ||
                    `Maafin aku kak.. (｡T ω T｡) Perintah untuk mengatur fitur *${feature}* cuma bisa dipakai sama Owner kesayangan Nexure aja.. (´･ᴗ･ \` )`
                );
            }

            const [setting] = await Setting.findOrCreate({
                where: { id: 1 },
                defaults: { is_public: true, is_register: true, is_gconly: false }
            });

            if (feature === 'public') {
                await setting.update({ is_public: status });
                await msgData.react('✅');
                return msgData.reply(
                    status
                        ? `Selesai! Sekarang Nexure bisa diakses semua orang yaa~ (˶˃ ᵕ ˂˶) ✨`
                        : `Selesai! Mode Maintenance aktif, Nexure hanya akan merespon Owner saja yaa.. (｡T ω T｡)`
                );
            } else if (feature === 'register') {
                await setting.update({ is_register: status });
                await msgData.react('✅');
                return msgData.reply(
                    status
                        ? `Selesai! Fitur *registrasi* sekarang sudah Nexure aktifkan (wajib daftar dulu) yaa~ (˶˃ ᵕ ˂˶)`
                        : `Selesai! Fitur *registrasi* dinonaktifkan (semua teman bebas akses tanpa daftar) yaa~ (๑>ᴗ<๑)`
                );
            } else if (feature === 'gconly') {
                await setting.update({ is_gconly: status });
                await msgData.react('✅');
                return msgData.reply(
                    status
                        ? `Selesai! Mode *Group Only* aktif, Nexure hanya merespon di dalam grup yaa~ (˶˃ ᵕ ˂˶)`
                        : `Selesai! Mode *Group Only* mati, Nexure bisa merespon di grup dan private chat yaa~ (๑>ᴗ<๑)`
                );
            }
        }

        // Fitur khusus Grup (Admin Only)
        if (['welcome', 'limit', 'autoai'].includes(feature)) {
            if (!msgData.isGroup) {
                return msgData.reply(
                    config.RYZUMI_MSG_GROUP ||
                    `Aduuh gawat! (๑>ᴗ<๑) Fitur *${feature}* cuma bisa dipakai bareng teman-teman di dalam grup aja kak~ (˶˃ ᵕ ˂˶)`
                );
            }

            if (!msgData.isAdmin && !user.isOwner) {
                return msgData.reply(
                    config.RYZUMI_MSG_ADMIN ||
                    `Aduuh! (๑>ᴗ<๑) Cuma Kakak Admin grup aja yang boleh mengatur fitur *${feature}*.. Kakak jadi Admin dulu yaa~ (´･ᴗ･ \` )`
                );
            }

            if (feature === 'welcome') {
                await group.update({ is_welcome: status });
                await msgData.react('✅');
                return msgData.reply(
                    status
                        ? `Horeee! Fitur *welcome* sekarang sudah Nexure aktifkan buat grup ini yaa~ (˶˃ ᵕ ˂˶) 🎉`
                        : `Selesai kak! Fitur *welcome* sekarang sudah dimatikan untuk grup ini yaa~ (｡T ω T｡)`
                );
            } else if (feature === 'limit') {
                await group.update({ is_limited: status });
                await msgData.react('✅');
                return msgData.reply(
                    status
                        ? `Selesai kak! Fitur *limit* di grup ini sudah aktif~ Sekarang setiap command bakal mengurangi limit yaa.. (｡T ω T｡)`
                        : `Horeee! Sekarang kakak bebas pakai command apa aja di grup ini tanpa limit! (๑>ᴗ<๑) ✨`
                );
            } else if (feature === 'autoai') {
                await group.update({ is_autoai: status });
                const botNum = sock.user?.id?.split(':')[0].split('@')[0] || 'bot';
                await msgData.react('✅');
                return msgData.reply(
                    status
                        ? `Horeee! Fitur *Auto AI* berhasil Nexure aktifkan untuk grup ini yaa~ (˶˃ ᵕ ˂˶) ✨\n\nSekarang kalau kakak *mention* Nexure (@${botNum}) atau *reply* pesan Nexure, Nexure bakal otomatis jawab! Kakak juga bisa kirim atau reply gambar yaa~ (๑>ᴗ<๑)`
                        : `Fitur *Auto AI* sekarang sudah dinonaktifkan untuk grup ini yaa kak~ (｡T ω T｡)\nNexure nggak akan otomatis jawab lagi saat di-mention atau di-reply di grup ini.`
                );
            }
        }
    }
};
