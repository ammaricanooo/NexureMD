import axios from 'axios';
import config from '../../config.js';

// ─────────────────────────────────────────
// Helper: Format rupiah
// ─────────────────────────────────────────
const formatRupiah = (amount) =>
    `Rp ${Number(amount).toLocaleString('id-ID')}`;

// ─────────────────────────────────────────
// Helper: Fetch data dari API Ammaricano
// ─────────────────────────────────────────
const fetchKAI = async (path) => {
    const url = `${config.API_AMMARICANO}${path}`;
    const response = await axios.get(url, { timeout: 10000 });
    if (!response.data?.success) throw new Error('API mengembalikan status gagal.');
    return response.data.result;
};

export default {
    command: ['krl', 'kai'],
    category: 'info',
    isRegistered: true,
    limit: 1,
    description: 'Info KRL Commuter Line: stasiun, peta rute, tarif, jadwal, dan info kereta.',
    async execute(sock, m, msgData) {
        const subcommand = msgData.args[0]?.toLowerCase();

        // ─── USAGE / HELP ───
        if (!subcommand || subcommand === 'help') {
            return msgData.reply(
                `🚆 *INFO KRL COMMUTER LINE* 🚆\n\n` +
                `Berikut perintah yang tersedia yaa kak:\n\n` +
                `• *.krl stasiun* — Lihat daftar stasiun KRL\n` +
                `• *.krl peta* — Tampilkan peta rute KRL\n` +
                `• *.krl tarif [asal] | [tujuan]* — Cek tarif & jarak perjalanan\n` +
                `• *.krl jadwal [stasiun] [dari] [sampai]* — Jadwal KRL di suatu stasiun\n` +
                `• *.krl kereta [train_id]* — Rute lengkap suatu kereta\n\n` +
                `*Contoh:*\n` +
                `\`.krl tarif Bogor | Jakarta Kota\`\n` +
                `\`.krl jadwal Bogor 05:00 08:00\`\n` +
                `\`.krl kereta 1017\`\n\n` +
                `✨ Selamat bepergian dengan KRL, kakak~ (˶˃ ᵕ ˂˶)`
            );
        }

        // ─── SUBCOMMAND: STASIUN ───
        if (['stasiun', 'station', 'stations'].includes(subcommand)) {
            await msgData.react('🕓');
            try {
                const stations = await fetchKAI('/api/info/kai/krl-station');

                // Pisahkan header wilayah dan stasiun biasa
                const areas = stations.filter(s => s.name.toUpperCase().startsWith('AREA'));
                const stationList = stations.filter(s => !s.name.toUpperCase().startsWith('AREA'));

                let text = `🚉 *DAFTAR STASIUN KRL COMMUTER LINE* 🚉\n\n`;

                // Kelompokkan per wilayah
                const grouped = {};
                for (const area of areas) {
                    grouped[area.group_wil] = {
                        label: area.name,
                        stations: stationList.filter(s => s.group_wil === area.group_wil)
                    };
                }

                for (const [, data] of Object.entries(grouped)) {
                    text += `┌─「 *${data.label}* 」\n`;
                    if (data.stations.length > 0) {
                        text += data.stations.map(s => `│ • ${s.name} \`[${s.id}]\``).join('\n');
                        text += '\n';
                    } else {
                        text += `│ _Tidak ada stasiun_\n`;
                    }
                    text += `└─────────────┈\n\n`;
                }

                text += `Total: *${stationList.length} stasiun* tersedia. (๑>ᴗ<๑)`;

                await msgData.reply(text.trim());
                await msgData.react('✅');

            } catch (error) {
                console.error('KRL Station Error:', error);
                await msgData.react('❌');
                await msgData.reply(
                    `Uwaaa gawat kak! Nexure gagal mengambil data stasiun KRL.. (╥﹏╥)\n\n*Error:* ${error.message}`
                );
            }
            return;
        }

        // ─── SUBCOMMAND: PETA RUTE ───
        if (['peta', 'map', 'routemap', 'rute'].includes(subcommand)) {
            await msgData.react('🕓');
            try {
                const maps = await fetchKAI('/api/info/kai/routemap');

                if (!maps || maps.length === 0) {
                    await msgData.react('❌');
                    return msgData.reply('Aduuh kak, data peta rute KRL tidak tersedia saat ini.. (╥﹏╥)');
                }

                // Kirim semua peta yang tersedia satu per satu
                await msgData.reply(
                    `🗺️ *PETA RUTE KRL COMMUTER LINE* 🗺️\n\n` +
                    `Berikut ${maps.length} peta rute KRL yang tersedia kak~ (˶˃ ᵕ ˂˶)`
                );

                for (let i = 0; i < maps.length; i++) {
                    const mapItem = maps[i];
                    const caption = `📍 *Peta Rute ${i + 1}/${maps.length}* — Area ${mapItem.area}`;
                    try {
                        await sock.sendMessage(msgData.remoteJid, {
                            image: { url: mapItem.permalink },
                            caption: caption
                        }, { quoted: m });
                    } catch {
                        // Jika gambar gagal dimuat, kirim URL sebagai teks
                        await msgData.reply(`${caption}\n🔗 ${mapItem.permalink}`);
                    }
                }

                await msgData.react('✅');

            } catch (error) {
                console.error('KRL Routemap Error:', error);
                await msgData.react('❌');
                await msgData.reply(
                    `Uwaaa gawat kak! Nexure gagal mengambil peta rute KRL.. (╥﹏╥)\n\n*Error:* ${error.message}`
                );
            }
            return;
        }

        // ─── SUBCOMMAND: TARIF ───
        if (['tarif', 'fare', 'harga', 'biaya'].includes(subcommand)) {
            const query = msgData.args.slice(1).join(' ');

            if (!query || !query.includes('|')) {
                return msgData.reply(
                    `Uwaaa! Kakak belum masukin stasiun asal dan tujuannya nih~ (｡T ω T｡)\n\n` +
                    `Format: *.krl tarif [asal] | [tujuan]*\n` +
                    `*Contoh:* \`.krl tarif Bogor | Jakarta Kota\``
                );
            }

            const [stationFrom, stationTo] = query.split('|').map(s => s.trim());

            if (!stationFrom || !stationTo) {
                return msgData.reply(
                    `Format kurang lengkap kak~ Gunakan:\n` +
                    `*.krl tarif [asal] | [tujuan]*`
                );
            }

            await msgData.react('🕓');
            try {
                const params = `stationfrom=${encodeURIComponent(stationFrom)}&stationto=${encodeURIComponent(stationTo)}`;
                const data = await fetchKAI(`/api/info/kai/fare?${params}`);

                const text =
                    `🎫 *TARIF KRL COMMUTER LINE* 🎫\n\n` +
                    `┌─────────────────────┈\n` +
                    `│ 🚉 *Dari    :* ${data.stationfrom}\n` +
                    `│ 🏁 *Tujuan  :* ${data.stationto}\n` +
                    `│ 📏 *Jarak   :* ${parseFloat(data.distance).toFixed(2)} km\n` +
                    `│ 💰 *Tarif   :* ${formatRupiah(data.fare)}\n` +
                    `└─────────────────────┈\n\n` +
                    `Selamat bepergian dengan KRL yaa kak! Semoga lancar~ (˶˃ ᵕ ˂˶) 🚆✨`;

                await msgData.reply(text);
                await msgData.react('✅');

            } catch (error) {
                console.error('KRL Fare Error:', error);
                await msgData.react('❌');

                const isNotFound = error.response?.status === 404 || error.message?.includes('404');
                if (isNotFound) {
                    await msgData.reply(
                        `Aduuh kak, stasiun *${stationFrom}* atau *${stationTo}* tidak ditemukan di database KRL.. (╥﹏╥)\n\n` +
                        `Coba cek nama stasiun yang benar dengan perintah: *.krl stasiun*`
                    );
                } else {
                    await msgData.reply(
                        `Uwaaa gawat kak! Nexure gagal mengambil data tarif KRL.. (╥﹏╥)\n\n*Error:* ${error.message}`
                    );
                }
            }
            return;
        }

        // ─── SUBCOMMAND: JADWAL STASIUN ───
        if (['jadwal', 'schedule', 'jadwalku'].includes(subcommand)) {
            // Format: .krl jadwal [stasiun] [dari] [sampai]
            const station  = msgData.args[1];
            const timeFrom = msgData.args[2];
            const timeTo   = msgData.args[3];

            if (!station) {
                return msgData.reply(
                    `Uwaaa! Kakak belum masukin nama stasiun & rentang waktu nih~ (｡T ω T｡)\n\n` +
                    `Format: *.krl jadwal [stasiun] [dari] [sampai]*\n` +
                    `*Contoh:* \`.krl jadwal Bogor 05:00 08:00\`\n\n` +
                    `💡 Jika waktu tidak diisi, default: *05:00 – 23:00*`
                );
            }

            const from = timeFrom || '05:00';
            const to   = timeTo   || '23:00';

            await msgData.react('🕓');
            try {
                const params = `station=${encodeURIComponent(station)}&timefrom=${encodeURIComponent(from)}&timeto=${encodeURIComponent(to)}`;
                const trains = await fetchKAI(`/api/info/kai/schedule?${params}`);

                if (!trains || trains.length === 0) {
                    await msgData.react('❌');
                    return msgData.reply(
                        `Aduuh kak, tidak ada jadwal KRL di stasiun *${station}* untuk rentang ${from} – ${to}.. (╥﹏╥)\n\n` +
                        `Coba periksa nama stasiun dengan: *.krl stasiun*`
                    );
                }

                let text = `🕐 *JADWAL KRL — ${station.toUpperCase()}* 🕐\n`;
                text += `⏱️ Rentang: *${from} – ${to}*\n`;
                text += `🚆 Ditemukan *${trains.length} kereta*\n\n`;

                trains.forEach((t, i) => {
                    const dep = t.time_est?.slice(0, 5)  || '-';
                    const arr = t.dest_time?.slice(0, 5) || '-';
                    text += `*${i + 1}.* [${t.train_id}] *${t.ka_name}*\n`;
                    text += `    🛤️ ${t.route_name}\n`;
                    text += `    🕓 Berangkat: *${dep}* → Tiba: *${arr}*\n`;
                    text += `    🏁 Tujuan Akhir: *${t.dest}*\n\n`;
                });

                text += `Semoga tidak ketinggalan kereta yaa kak~ (˶˃ ᵕ ˂˶) 🚆✨`;

                await msgData.reply(text.trim());
                await msgData.react('✅');

            } catch (error) {
                console.error('KRL Schedule Error:', error);
                await msgData.react('❌');
                await msgData.reply(
                    `Uwaaa gawat kak! Nexure gagal mengambil data jadwal KRL.. (╥﹏╥)\n\n*Error:* ${error.message}`
                );
            }
            return;
        }

        // ─── SUBCOMMAND: RUTE KERETA ───
        if (['kereta', 'train', 'trainschedule', 'infotrain'].includes(subcommand)) {
            const trainId = msgData.args[1];

            if (!trainId) {
                return msgData.reply(
                    `Uwaaa! Kakak belum masukin ID keretanya nih~ (｡T ω T｡)\n\n` +
                    `Format: *.krl kereta [train_id]*\n` +
                    `*Contoh:* \`.krl kereta 1017\`\n\n` +
                    `💡 Cari Train ID lewat: *.krl jadwal [stasiun] [dari] [sampai]*`
                );
            }

            await msgData.react('🕓');
            try {
                const stops = await fetchKAI(`/api/info/kai/schedule-train?trainid=${encodeURIComponent(trainId)}`);

                if (!stops || stops.length === 0) {
                    await msgData.react('❌');
                    return msgData.reply(
                        `Aduuh kak, kereta dengan ID *${trainId}* tidak ditemukan.. (╥﹏╥)\n\n` +
                        `Coba cari Train ID lewat: *.krl jadwal [stasiun] [dari] [sampai]*`
                    );
                }

                const info = stops[0];
                const origin  = stops[0];
                const dest    = stops[stops.length - 1];

                let text = `🚆 *RUTE KERETA ${info.train_id}* 🚆\n`;
                text += `📋 *${info.ka_name}*\n`;
                text += `🛤️ ${origin.station_name} → ${dest.station_name}\n`;
                text += `🕓 ${origin.time_est?.slice(0,5)} → ${dest.time_est?.slice(0,5)}\n\n`;
                text += `*Daftar Pemberhentian (${stops.length} stasiun):*\n`;
                text += `┌─────────────────────┈\n`;

                stops.forEach((s, i) => {
                    const time = s.time_est?.slice(0, 5) || '-';
                    const isTransit = s.transit_station ? ` 🔄 _(Transit: ${s.transit})_` : '';
                    const isFirst = i === 0;
                    const isLast  = i === stops.length - 1;
                    const marker  = isFirst ? '🟢' : isLast ? '🔴' : '⚪';
                    text += `│ ${marker} *${time}* — ${s.station_name} \`[${s.station_id}]\`${isTransit}\n`;
                });

                text += `└─────────────────────┈\n\n`;
                text += `Semoga perjalanan kakak menyenangkan~ (˶˃ ᵕ ˂˶) 🚆✨`;

                await msgData.reply(text.trim());
                await msgData.react('✅');

            } catch (error) {
                console.error('KRL Train Schedule Error:', error);
                await msgData.react('❌');
                await msgData.reply(
                    `Uwaaa gawat kak! Nexure gagal mengambil data rute kereta.. (╥﹏╥)\n\n*Error:* ${error.message}`
                );
            }
            return;
        }

        // ─── SUBCOMMAND TIDAK DIKENAL ───
        return msgData.reply(
            `Uwaaa! Subcommand *${subcommand}* tidak dikenal kak.. (｡T ω T｡)\n\n` +
            `Ketik *.krl help* untuk melihat daftar perintah yang tersedia yaa~ (˶˃ ᵕ ˂˶)`
        );
    }
};
