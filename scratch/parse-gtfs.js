import fs from 'fs';
import path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';

const GTFS_URL = 'http://michielbdejong.com/angkots-gtfs.zip';
const TEMP_DIR = path.resolve('./scratch/gtfs-temp');
const ZIP_PATH = path.join(TEMP_DIR, 'angkots-gtfs.zip');

async function downloadAndParseGTFS() {
    console.log('⏳ Memulai pengunduhan GTFS Bogor Angkot...');
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // 1. Download file zip GTFS
    const response = await axios({
        url: GTFS_URL,
        method: 'GET',
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(ZIP_PATH);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    console.log('✅ File GTFS berhasil diunduh.');

    // 2. Ekstrak zip
    console.log('⏳ Mengekstrak file zip...');
    const zip = new AdmZip(ZIP_PATH);
    zip.extractAllTo(TEMP_DIR, true);
    console.log('✅ File berhasil diekstrak.');

    // 3. Baca routes.txt dan stops.txt & stop_times.txt / trips.txt
    console.log('⏳ Memproses data GTFS...');
    const routesContent = fs.readFileSync(path.join(TEMP_DIR, 'routes.txt'), 'utf-8');
    const stopsContent = fs.readFileSync(path.join(TEMP_DIR, 'stops.txt'), 'utf-8');
    const tripsContent = fs.readFileSync(path.join(TEMP_DIR, 'trips.txt'), 'utf-8');
    const stopTimesContent = fs.readFileSync(path.join(TEMP_DIR, 'stop_times.txt'), 'utf-8');

    const rawRoutes = parse(routesContent, { columns: true, skip_empty_lines: true });
    const rawStops = parse(stopsContent, { columns: true, skip_empty_lines: true });
    const rawTrips = parse(tripsContent, { columns: true, skip_empty_lines: true });
    const rawStopTimes = parse(stopTimesContent, { columns: true, skip_empty_lines: true });

    console.log(`Berhasil memuat: ${rawRoutes.length} routes, ${rawStops.length} stops, ${rawTrips.length} trips, ${rawStopTimes.length} stop_times.`);

    // Buat peta stop_id -> stop_name
    const stopMap = {};
    rawStops.forEach(stop => {
        stopMap[stop.stop_id] = stop.stop_name.trim();
    });

    // Petakan trip_id -> route_id
    const tripToRouteMap = {};
    rawTrips.forEach(trip => {
        tripToRouteMap[trip.trip_id] = trip.route_id;
    });

    // Petakan route_id -> list stop_id (diurutkan berdasarkan stop_sequence)
    const routeStopsMap = {};
    rawStopTimes.forEach(st => {
        const routeId = tripToRouteMap[st.trip_id];
        if (!routeId) return;

        if (!routeStopsMap[routeId]) {
            routeStopsMap[routeId] = {};
        }

        // Simpan berdasarkan sequence
        routeStopsMap[routeId][st.stop_sequence] = st.stop_id;
    });

    // Susun rute final
    const trayekAngkot = [];
    const aliasSet = new Set();
    const aliasLokasi = {
        'empang': 'Empang',
        'pasar bogor': 'Pasar Bogor',
        'pasar anyar': 'Pasar Anyar',
        'btm': 'BTM',
        'botani square': 'BTM',
        'taman kencana': 'Taman Kencana',
        'ciawi': 'Terminal Ciawi',
        'terminal ciawi': 'Terminal Ciawi',
        'baranangsiang': 'Terminal Baranangsiang',
        'terminal baranangsiang': 'Terminal Baranangsiang',
        'bubulak': 'Terminal Bubulak',
        'terminal bubulak': 'Terminal Bubulak',
        'laladon': 'Laladon',
        'ciapus': 'Ciapus',
        'ciomas': 'Ciomas',
        'sukasari': 'Sukasari',
    };

    rawRoutes.forEach(r => {
        const routeId = r.route_id;
        const routeShortName = r.route_short_name || '';
        const routeLongName = r.route_long_name || '';

        const sequenceMap = routeStopsMap[routeId];
        if (!sequenceMap) return;

        // Urutkan sequences
        const sequences = Object.keys(sequenceMap).map(Number).sort((a, b) => a - b);
        const stopsList = sequences.map(seq => stopMap[sequenceMap[seq]]).filter(Boolean);

        if (stopsList.length === 0) return;

        // Tebak warna dari deskripsi/nama atau default
        let warna = 'Hijau';
        if (routeLongName.toLowerCase().includes('kab') || routeShortName.startsWith('03')) {
            warna = 'Biru';
        }

        // Tambah stops ke aliasLokasi
        stopsList.forEach(stop => {
            const clean = stop.toLowerCase().trim();
            if (clean.length > 2 && !aliasLokasi[clean]) {
                aliasLokasi[clean] = stop;
            }
        });

        // Estimasi tarif dan waktu dari jarak/jumlah stop
        const totalStops = stopsList.length;
        const estimasiTarif = routeShortName.includes('TPK') || totalStops > 15 ? 6000 : 4000;
        const estimasiMenit = Math.max(15, totalStops * 2.5); // Kasih estimasi kasar 2.5 menit per pemberhentian

        trayekAngkot.push({
            kode: routeShortName,
            nama: routeLongName,
            warna: warna,
            rute: stopsList,
            jarak_km: parseFloat((totalStops * 0.7).toFixed(1)), // Estimasi jarak kasar
            waktu_menit: Math.round(estimasiMenit),
            tarif: estimasiTarif,
            keterangan: `Trayek ${routeLongName}`
        });
    });

    // 4. Gabungkan dengan rute manual Kabupaten Bogor agar lengkap
    console.log('⏳ Menggabungkan rute tambahan Kabupaten Bogor...');
    const ruteKabupaten = [
        {
            kode: '03 (Kab)',
            nama: 'Ciapus – Ramayana (BTM)',
            warna: 'Biru (Kabupaten)',
            rute: ['Ciapus', 'Kota Batu', 'Cikaret', 'Empang', 'Bondongan', 'Gang Aut', 'Pasar Cumpok', 'BTM'],
            jarak_km: 11,
            waktu_menit: 45,
            tarif: 6000,
            keterangan: 'Menghubungkan Ciapus Kabupaten Bogor ke pusat Kota (BTM via Empang)'
        },
        {
            kode: '02 (Kab)',
            nama: 'Cisarua – Sukasari',
            warna: 'Biru (Kabupaten)',
            rute: ['Cisarua', 'Tugu', 'Megamendung', 'Gadog', 'Terminal Ciawi', 'Tajur', 'Sukasari'],
            jarak_km: 22,
            waktu_menit: 70,
            tarif: 10000,
            keterangan: 'Rute Puncak menuju Sukasari'
        },
        {
            kode: '02A (Kab)',
            nama: 'Cicurug – Sukasari',
            warna: 'Biru (Kabupaten)',
            rute: ['Cicurug', 'Cigombong', 'Caringin', 'Terminal Ciawi', 'Tajur', 'Sukasari'],
            jarak_km: 25,
            waktu_menit: 80,
            tarif: 10000,
            keterangan: 'Rute Sukabumi-Bogor via Ciawi'
        }
    ];

    ruteKabupaten.forEach(r => {
        // Daftarkan rute
        trayekAngkot.push(r);
        // Daftarkan stops ke alias
        r.rute.forEach(stop => {
            const clean = stop.toLowerCase().trim();
            if (clean.length > 2 && !aliasLokasi[clean]) {
                aliasLokasi[clean] = stop;
            }
        });
    });

    // Tulis ke databases/angkot-bogor.js
    const outputFilePath = path.resolve('./databases/angkot-bogor.js');
    const content = `/**
 * Dataset Rute Angkot Bogor yang digenerate otomatis dari GTFS (michielbdejong/bogor-angkot-gtfs)
 * Terupdate otomatis via build script.
 */

export const trayekAngkot = ${JSON.stringify(trayekAngkot, null, 4)};

export const aliasLokasi = ${JSON.stringify(aliasLokasi, null, 4)};

export function cariRute(asal, tujuan) {
    const normalAsal = normalisasiLokasi(asal);
    const normalTujuan = normalisasiLokasi(tujuan);

    const langsung = [];
    const transfer = [];

    // Cari rute langsung
    for (const trayek of trayekAngkot) {
        const idxAsal = temukan(trayek.rute, normalAsal);
        const idxTujuan = temukan(trayek.rute, normalTujuan);

        if (idxAsal !== -1 && idxTujuan !== -1 && idxAsal < idxTujuan) {
            langsung.push({
                trayek,
                dariStop: trayek.rute[idxAsal],
                keStop: trayek.rute[idxTujuan],
                stops: trayek.rute.slice(idxAsal, idxTujuan + 1)
            });
        }
    }

    // Cari rute transfer (ganti angkot 1x) jika tidak ada rute langsung
    if (langsung.length === 0) {
        for (const t1 of trayekAngkot) {
            const idxAsal1 = temukan(t1.rute, normalAsal);
            if (idxAsal1 === -1) continue;

            for (const stopTransfer of t1.rute.slice(idxAsal1 + 1)) {
                for (const t2 of trayekAngkot) {
                    if (t1.kode === t2.kode) continue;
                    const idxTransfer2 = temukan(t2.rute, stopTransfer);
                    const idxTujuan2 = temukan(t2.rute, normalTujuan);

                    if (idxTransfer2 !== -1 && idxTujuan2 !== -1 && idxTransfer2 < idxTujuan2) {
                        const idxAsal1Real = temukan(t1.rute, normalAsal);
                        const idxTransfer1 = temukan(t1.rute, stopTransfer);

                        const sudahAda = transfer.some(r =>
                            r.t1.kode === t1.kode && r.t2.kode === t2.kode && r.transfer === stopTransfer
                        );
                        if (!sudahAda && idxTransfer1 > idxAsal1Real) {
                            transfer.push({
                                t1,
                                t2,
                                transfer: stopTransfer,
                                stops1: t1.rute.slice(idxAsal1Real, idxTransfer1 + 1),
                                stops2: t2.rute.slice(idxTransfer2, idxTujuan2 + 1)
                            });
                        }
                    }
                }
            }
        }
    }

    return { langsung, transfer: transfer.slice(0, 3) };
}

function normalisasiLokasi(input) {
    const lower = input.toLowerCase().trim();
    return aliasLokasi[lower] || capitalizeWords(lower);
}

function temukan(rute, target) {
    const targetLower = target.toLowerCase();
    return rute.findIndex(stop => stop.toLowerCase().includes(targetLower) || targetLower.includes(stop.toLowerCase()));
}

function capitalizeWords(str) {
    return str.replace(/\\b\\w/g, c => c.toUpperCase());
}
`;

    fs.writeFileSync(outputFilePath, content, 'utf-8');
    console.log(`\n🎉 SUKSES! File database telah diperbarui dengan ${trayekAngkot.length} rute angkot terintegrasi GTFS.`);
}

downloadAndParseGTFS().catch(console.error);
