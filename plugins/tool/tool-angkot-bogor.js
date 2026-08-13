import { cariRute } from '../../databases/angkot-bogor.js';

export default {
    command: ['angkot', 'ruteangkot', 'angkotbogor'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Mencari rute trayek angkot di Kota Bogor',
    async execute(sock, m, msgData) {
        const query = msgData.args.join(' ');

        if (!query || !query.includes('ke')) {
            return msgData.reply(
                `🚌 *PANDUAN RUTE ANGKOT BOGOR* 🚌\n\n` +
                `Kakak manis mau cari rute angkot? Pakai format ini yaa:\n` +
                `*.angkot [asal] ke [tujuan]*\n\n` +
                `*Contoh:* \`.angkot ciapus ke empang\` atau \`.angkot ciawi ke bubulak\`\n\n` +
                `✨ *Catatan:* Jika rute tidak ditemukan secara langsung, Nexure akan mendeteksi opsi rute transit/transfer (1x ganti angkot) buat kakak! (๑>ᴗ<๑)`
            );
        }

        const [asal, tujuan] = query.split(/\s+ke\s+/i);

        if (!asal || !tujuan) {
            return msgData.reply(
                `Uwaaa! Format pencariannya kurang lengkap kak.. (｡T ω T｡)\n\n` +
                `Gunakan format: *.angkot [asal] ke [tujuan]*\n` +
                `*Contoh:* \`.angkot ciapus ke empang\``
            );
        }

        await msgData.react('🕓');

        try {
            const hasil = cariRute(asal, tujuan);

            if (hasil.langsung.length === 0 && hasil.transfer.length === 0) {
                await msgData.react('❌');
                return msgData.reply(
                    `Aduuh gawat kak, Nexure belum nemu rute angkot dari *${asal.trim()}* ke *${tujuan.trim()}*.. (╥﹏╥)\n\n` +
                    `Mungkin nama lokasinya kurang spesifik atau di luar jangkauan trayek Bogor. Coba pakai nama tempat terdekat yaa~ (๑>ᴗ<๑)`
                );
            }

            let responseText = `🚌 *HASIL PENCARIAN RUTE ANGKOT BOGOR* 🚌\n\n`;
            responseText += `📍 *Dari :* ${asal.trim()}\n`;
            responseText += `🏁 *Ke   :* ${tujuan.trim()}\n\n`;

            if (hasil.langsung.length > 0) {
                responseText += `✅ *Rute Langsung (Tanpa Transit):*\n`;
                hasil.langsung.forEach((r, index) => {
                    responseText += `\n*Opsi ${index + 1}: Angkot No. ${r.trayek.kode} (${r.trayek.nama})*\n`;
                    responseText += `• 🚙 Warna: ${r.trayek.warna}\n`;
                    responseText += `• 🛣️ Rute Naik: ${r.dariStop} ➡️ ${r.keStop}\n`;
                    if (r.reversed) {
                        responseText += `• 🔁 Arah balik (naik sebaliknya)\n`;
                    }
                    responseText += `• ⏱️ Estimasi Waktu: ~${r.trayek.waktu_menit} menit\n`;
                    responseText += `• 💰 Ongkos: Rp ${r.trayek.tarif.toLocaleString('id-ID')}\n`;
                    if (r.trayek.keterangan) {
                        responseText += `• 📝 Info: ${r.trayek.keterangan}\n`;
                    }
                });
            } else if (hasil.transfer.length > 0) {
                responseText += `🔄 *Rute Transit (Ganti Angkot 1x):*\n`;
                hasil.transfer.forEach((r, index) => {
                    const totalTarif = r.t1.tarif + r.t2.tarif;
                    const totalWaktu = r.t1.waktu_menit + r.t2.waktu_menit + 5; // +5 mnt nunggu transit

                    responseText += `\n*Opsi ${index + 1}: Naik 2 Angkot*\n`;
                    responseText += `1️⃣ Naik *Angkot ${r.t1.kode}* (${r.t1.nama}) - Warna ${r.t1.warna}\n`;
                    responseText += `   📍 Turun di tempat transit: *${r.transfer}*\n`;
                    responseText += `2️⃣ Lanjut naik *Angkot ${r.t2.kode}* (${r.t2.nama}) - Warna ${r.t2.warna}\n`;
                    responseText += `   🏁 Turun di tujuan akhir: *${tujuan.trim()}*\n`;
                    responseText += `• ⏱️ Total Estimasi: ~${totalWaktu} menit\n`;
                    responseText += `• 💰 Total Ongkos: Rp ${totalTarif.toLocaleString('id-ID')} (2x bayar)\n`;
                });
            }

            responseText += `\nSemangat jalannya yaa kak! Semoga selamat sampai tujuan~ (˶˃ ᵕ ˂˶) ✨`;

            await msgData.reply(responseText.trim());
            await msgData.react('✅');

        } catch (error) {
            console.error('Error Rute Angkot:', error);
            await msgData.react('❌');
            await msgData.reply(
                `Uwaaa gawat! Terjadi kesalahan saat mencari rute angkot kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            );
        }
    }
};

