import { cariRute } from '../../databases/angkot-bogor.js';
import { parseAngkotQueryWithGemini, getGeminiNavigationAdvice } from '../../libs/gemini.js';

export default {
    command: ['angkot', 'ruteangkot', 'angkotbogor'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Mencari rute trayek angkot di Kota Bogor (Dukungan Gemini AI)',
    async execute(sock, m, msgData) {
        const query = msgData.args.join(' ').trim();

        if (!query) {
            return msgData.reply(
                `🚌 *PANDUAN RUTE ANGKOT BOGOR (AI HYBRID)* 🚌\n\n` +
                `Kakak manis mau cari rute angkot? Bisa pakai dua cara yaa:\n\n` +
                `1️⃣ *Format Standar:* \`.angkot [asal] ke [tujuan]\`\n` +
                `   *Contoh:* \`.angkot ciapus ke empang\`\n\n` +
                `2️⃣ *Percakapan Bebas (Gemini AI):*\n` +
                `   *Contoh:* \`.angkot aku lagi di botani mau ke ipb dramaga\`\n\n` +
                `✨ *Fitur Pintar:* Jika rute lokal tidak ditemukan, AI Nexure akan memberikan saran rute angkot/transportasi alternatif buat kakak! (๑>ᴗ<๑)`
            );
        }

        let asal = '';
        let tujuan = '';

        if (query.toLowerCase().includes(' ke ')) {
            const parts = query.split(/\s+ke\s+/i);
            asal = parts[0]?.trim() || '';
            tujuan = parts[1]?.trim() || '';
        }

        await msgData.react('🕓');

        // Jika format 'ke' tidak ditemukan, coba ekstrak menggunakan Gemini AI
        if (!asal || !tujuan) {
            const aiParsed = await parseAngkotQueryWithGemini(query);
            if (aiParsed && aiParsed.asal && aiParsed.tujuan) {
                asal = aiParsed.asal;
                tujuan = aiParsed.tujuan;
            }
        }

        if (!asal || !tujuan) {
            await msgData.react('❌');
            return msgData.reply(
                `Uwaaa! Nexure belum bisa mengenali lokasi asal dan tujuan dari pesan kakak.. (｡T ω T｡)\n\n` +
                `Coba gunakan format: *.angkot [asal] ke [tujuan]*\n` +
                `*Contoh:* \`.angkot ciapus ke empang\``
            );
        }

        try {
            const hasil = cariRute(asal, tujuan);

            if (hasil.langsung.length === 0 && hasil.transfer.length === 0) {
                // Cobalah peroleh saran navigasi alternatif dari Gemini AI
                const aiAdvice = await getGeminiNavigationAdvice(asal, tujuan);
                if (aiAdvice) {
                    await msgData.react('✅');
                    return msgData.reply(
                        `🤖 *SARAN NAVIGASI ALTERNATIF (GEMINI AI)* 🤖\n\n` +
                        `Rute angkot langsung/1x transit dari *${asal}* ke *${tujuan}* belum tersedia di database lokal. Berikut saran navigasi dari AI Nexure:\n\n` +
                        `${aiAdvice}\n\n` +
                        `Semoga membantu perjalanan kakak yaa~! (˶˃ ᵕ ˂˶) ✨`
                    );
                }

                await msgData.react('❌');
                return msgData.reply(
                    `Aduuh gawat kak, Nexure belum nemu rute angkot dari *${asal}* ke *${tujuan}*.. (╥﹏╥)\n\n` +
                    `Mungkin nama lokasinya kurang spesifik atau di luar jangkauan trayek Bogor. Coba pakai nama tempat terdekat yaa~ (๑>ᴗ<๑)`
                );
            }

            let responseText = `🚌 *HASIL PENCARIAN RUTE ANGKOT BOGOR* 🚌\n\n`;
            responseText += `📍 *Dari :* ${asal}\n`;
            responseText += `🏁 *Ke   :* ${tujuan}\n\n`;

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
                    const totalWaktu = r.t1.waktu_menit + r.t2.waktu_menit + 5;

                    responseText += `\n*Opsi ${index + 1}: Naik 2 Angkot*\n`;
                    responseText += `1️⃣ Naik *Angkot ${r.t1.kode}* (${r.t1.nama}) - Warna ${r.t1.warna}\n`;
                    responseText += `   📍 Turun di tempat transit: *${r.transfer}*\n`;
                    responseText += `2️⃣ Lanjut naik *Angkot ${r.t2.kode}* (${r.t2.nama}) - Warna ${r.t2.warna}\n`;
                    responseText += `   🏁 Turun di tujuan akhir: *${tujuan}*\n`;
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


