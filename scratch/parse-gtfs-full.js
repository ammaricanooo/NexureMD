import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_DIR = path.resolve(__dirname, 'bogor-angkot-gtfs');

console.log('🚌 Memulai parse data angkot Bogor dari semua sumber...\n');

// =============================================
// 1. Baca semua sumber JSON dari folder build/
// =============================================
const buildDir = path.join(REPO_DIR, 'build');
const majalah = JSON.parse(fs.readFileSync(path.join(buildDir, 'majalah.json'), 'utf-8'));
const lovelybogor = JSON.parse(fs.readFileSync(path.join(buildDir, 'lovelybogor.json'), 'utf-8'));
const duamenit = JSON.parse(fs.readFileSync(path.join(buildDir, '2menit.json'), 'utf-8'));
const enterbogor = JSON.parse(fs.readFileSync(path.join(buildDir, 'enterbogor.json'), 'utf-8'));

console.log(`✅ Loaded majalah: ${Object.keys(majalah.routes).length} rute, ${majalah.places.length} tempat`);
console.log(`✅ Loaded lovelybogor: ${Object.keys(lovelybogor.routes).length} rute`);
console.log(`✅ Loaded 2menit: ${Object.keys(duamenit.routes).length} rute`);
console.log(`✅ Loaded enterbogor: ${Object.keys(enterbogor.routes).length} rute`);

// =============================================
// 2. Baca data Kabupaten dari office text file
// =============================================
const kabupatenRaw = fs.readFileSync(
    path.join(REPO_DIR, 'data-from-kabupaten-office', 'data-entry.txt'),
    'utf-8'
);
const kabupatenRoutes = [];
kabupatenRaw.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;
    const parts = line.split('\t');
    if (parts.length < 3) return;
    const kategori = parts[0].trim();
    const kode = parts[1].trim();
    const ruteRaw = parts[2].trim();
    // Parse stops dari format "titik1 - titik2 - titik3"
    const stops = ruteRaw.split(' - ').map(s => capitalizeWords(s.trim())).filter(Boolean);
    kabupatenRoutes.push({ kategori, kode, stops });
});
console.log(`✅ Loaded kabupaten office: ${kabupatenRoutes.length} rute`);

// =============================================
// 3. Merge semua rute kota (AK-xx & AP-xx)
// =============================================

// Prioritas sumber: majalah > lovelybogor > enterbogor > 2menit
// Karena majalah memiliki nama stop paling lengkap dan proper case
const allSourceRoutes = {};

function mergeRouteData(sourceRoutes, sourceName) {
    for (const [routeId, routeData] of Object.entries(sourceRoutes)) {
        if (!routeId || routeId.trim() === '') continue;
        const id = routeId.trim();
        if (!allSourceRoutes[id]) {
            allSourceRoutes[id] = {
                kode: id,
                nama: '',
                warna: '',
                stops_sources: {}
            };
        }
        if (routeData.name && !allSourceRoutes[id].nama) {
            allSourceRoutes[id].nama = routeData.name;
        }
        if (routeData.colour && !allSourceRoutes[id].warna) {
            allSourceRoutes[id].warna = routeData.colour;
        }
        if (routeData.stops && routeData.stops.length > 0) {
            allSourceRoutes[id].stops_sources[sourceName] = routeData.stops;
        }
    }
}

mergeRouteData(majalah.routes, 'majalah');
mergeRouteData(lovelybogor.routes, 'lovelybogor');
mergeRouteData(duamenit.routes, '2menit');
mergeRouteData(enterbogor.routes, 'enterbogor');

// =============================================
// 4. Pilih stops terbaik per rute (prioritas majalah)
// =============================================
function pickBestStops(stopsData) {
    // Prioritas: majalah (proper case) > lovelybogor > enterbogor > 2menit
    const priority = ['majalah', 'lovelybogor', 'enterbogor', '2menit'];
    for (const src of priority) {
        if (stopsData[src] && stopsData[src].length > 1) {
            return stopsData[src];
        }
    }
    // Fallback: ambil sumber manapun yang punya data
    for (const src of Object.keys(stopsData)) {
        if (stopsData[src] && stopsData[src].length > 0) {
            return stopsData[src];
        }
    }
    return [];
}

// =============================================
// 5. Tentukan tarif berdasarkan kode & kategori
// =============================================
function tentukantarif(kode, warna) {
    const w = (warna || '').toLowerCase();
    if (w.includes('biru') || kode.startsWith('AP-') || kode.startsWith('Kat')) {
        return 6000;
    }
    if (kode === 'TPK' || kode.includes('TPK')) return 5000;
    return 4000;
}

function tentukanWarna(warna, kode) {
    const w = (warna || '').toLowerCase();
    if (w.includes('biru')) return 'Biru';
    if (w.includes('merah')) return 'Merah';
    if (w.includes('kuning')) return 'Kuning';
    if (w.includes('putih')) return 'Putih';
    if (w.includes('orange') || w.includes('jingga')) return 'Orange';
    if (w.includes('ungu')) return 'Ungu';
    if (w.includes('silver') || w.includes('abu')) return 'Silver';
    if (w.includes('coklat')) return 'Coklat';
    if (kode.startsWith('AP-')) return 'Biru';
    return 'Hijau';
}

// =============================================
// 6. Susun array trayek final
// =============================================
const trayekAngkot = [];

// 6a. Rute Kota dari website sources
for (const [routeId, data] of Object.entries(allSourceRoutes)) {
    if (!routeId || routeId.trim() === '') continue;

    const stops = pickBestStops(data.stops_sources);
    if (stops.length < 2) continue; // skip rute tanpa stop valid

    // Bersihkan nama stops (titik koordinat ll_xxx_xxx dikecualikan)
    const cleanStops = stops
        .filter(s => s && !s.startsWith('ll_') && s.length > 0)
        .map(s => capitalizeWords(s.replace(/\s+/g, ' ').trim()));

    if (cleanStops.length < 2) continue;

    const namaRute = typeof data.nama === 'string'
        ? data.nama
        : (typeof data.nama === 'object' ? Object.values(data.nama)[0] || '' : '');

    const warnaRaw = typeof data.warna === 'string'
        ? data.warna
        : (typeof data.warna === 'object' ? Object.values(data.warna)[0] || '' : '');

    const warna = tentukanWarna(warnaRaw, routeId);
    const tarif = tentukantarif(routeId, warnaRaw);
    const estimasiMenit = Math.max(10, cleanStops.length * 2.5);
    const estimasiKm = parseFloat((cleanStops.length * 0.6).toFixed(1));

    trayekAngkot.push({
        kode: routeId,
        nama: namaRute,
        warna,
        rute: cleanStops,
        jarak_km: estimasiKm,
        waktu_menit: Math.round(estimasiMenit),
        tarif,
        keterangan: `Sumber: website (${Object.keys(data.stops_sources).join(', ')})`
    });
}

// 6b. Rute Kabupaten dari office data
for (const r of kabupatenRoutes) {
    if (r.stops.length < 2) continue;
    const tarif = 7000; // kabupaten lebih mahal
    const estimasiMenit = Math.max(15, r.stops.length * 4);
    const estimasiKm = parseFloat((r.stops.length * 1.5).toFixed(1));

    trayekAngkot.push({
        kode: `Kab-${r.kode}`,
        nama: r.stops[0] + ' – ' + r.stops[r.stops.length - 1],
        warna: 'Biru (Kabupaten)',
        rute: r.stops,
        jarak_km: estimasiKm,
        waktu_menit: Math.round(estimasiMenit),
        tarif,
        keterangan: `Trayek Kabupaten Bogor (${r.kategori}) – Sumber: Dinas Perhubungan Kab. Bogor`
    });
}

// =============================================
// 7. Build aliasLokasi secara otomatis
// =============================================
const aliasLokasi = {};

// Alias manual untuk lokasi populer
const manualAlias = {
    'empang': 'Empang',
    'pasar bogor': 'Pasar Bogor',
    'pasar anyar': 'Pasar Anyar',
    'btm': 'BTM Bogor Trade Mall',
    'botani square': 'Botani Square',
    'botanimall': 'Botani Square',
    'taman kencana': 'Taman Kencana',
    'pajajaran': 'JL.Raya Pajajaran',
    'jl pajajaran': 'JL.Raya Pajajaran',
    'merdeka': 'JL.Merdeka',
    'terminal merdeka': 'Terminal Merdeka',
    'ciawi': 'Ciawi',
    'terminal ciawi': 'Ciawi',
    'baranangsiang': 'Terminal Baranangsiang',
    'terminal baranangsiang': 'Terminal Baranangsiang',
    'bara': 'Terminal Baranangsiang',
    'bubulak': 'Terminal Bubulak',
    'terminal bubulak': 'Terminal Bubulak',
    'laladon': 'Terminal Laladon',
    'terminal laladon': 'Terminal Laladon',
    'ciapus': 'Ciapus',
    'ciomas': 'Ciomas',
    'sukasari': 'Sukasari',
    'ciparigi': 'Ciparigi',
    'cimahpar': 'Cimahpar',
    'warung jambu': 'Warung Jambu',
    'warungjambu': 'Warung Jambu',
    'bantar kemang': 'Bantar Kemang',
    'bantarkemang': 'Bantar Kemang',
    'ramayana': 'Ramayana',
    'stasiun bogor': 'Stasiun Bogor',
    'kebun raya': 'Kebun Raya Bogor',
    'kebun raya bogor': 'Kebun Raya Bogor',
    'gang aut': 'Gang Aut',
    'gg aut': 'Gang Aut',
    'gg.aut': 'Gang Aut',
    'sindang barang': 'JL.Sindang Barang',
    'sindangbarang': 'JL.Sindang Barang',
    'lawang gintung': 'JL.Lawang Gintung',
    'batutulis': 'Stasiun Batutulis Bogor',
    'pomad': 'Pomad',
    'mulyaharja': 'Mulyaharja',
    'rancamaya': 'Rancamaya',
    'cihideung': 'Cihideung',
    'ciheuleut': 'Ciheuleut',
    'cipaku': 'Cipaku',
    'cipinang gading': 'Cipinang Gading',
    'tajur': 'JL.Raya Tajur',
    'kota batu': 'Kota Batu',
    'kotabatu': 'Kota Batu',
    'cikaret': 'Cikaret',
    'bondongan': 'Bondongan',
    'pasar cumpok': 'Pasar Cumpok',
    'leuwiliang': 'Leuwiliang',
    'jasinga': 'Jasinga',
    'cibinong': 'Terminal Cibinong',
    'terminal cibinong': 'Terminal Cibinong',
    'cibeureum': 'Cibeureum',
    'ciampea': 'Ciampea',
    'terminal ciampea': 'Ciampea',
};

Object.assign(aliasLokasi, manualAlias);

// Auto-add semua stop unik dari semua rute
const semuaStopUniq = new Set();
trayekAngkot.forEach(t => t.rute.forEach(s => semuaStopUniq.add(s)));
semuaStopUniq.forEach(stop => {
    const key = stop.toLowerCase().trim();
    if (!aliasLokasi[key]) {
        aliasLokasi[key] = stop;
    }
});

// =============================================
// 8. Tulis ke databases/angkot-bogor.js
// =============================================
const outputPath = path.resolve(__dirname, '..', 'databases', 'angkot-bogor.js');

const outputContent = `/**
 * Dataset Rute Angkot Bogor
 * Digenerate otomatis dari semua sumber di repositori michielbdejong/bogor-angkot-gtfs
 * Sumber: majalah transportasi, lovelybogor.com, 2menit.com, enterbogor, data Dishub Kab. Bogor
 * Total rute: ${trayekAngkot.length}
 * 
 * Untuk update ulang, jalankan: node scratch/parse-gtfs-full.js
 */

export const trayekAngkot = ${JSON.stringify(trayekAngkot, null, 2)};

export const aliasLokasi = ${JSON.stringify(aliasLokasi, null, 2)};

/**
 * Mencari trayek berdasarkan asal dan tujuan
 * @param {string} asal
 * @param {string} tujuan
 * @returns {{ langsung: Array, transfer: Array }}
 */
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
    return rute.findIndex(stop =>
        stop.toLowerCase().includes(targetLower) ||
        targetLower.includes(stop.toLowerCase())
    );
}

function capitalizeWords(str) {
    return str.replace(/\\b\\w/g, c => c.toUpperCase());
}
`;

fs.writeFileSync(outputPath, outputContent, 'utf-8');

// Summary
console.log(`\n✅ Database berhasil digenerate!`);
console.log(`📊 Total rute angkot kota (AK/AP): ${trayekAngkot.filter(t => !t.kode.startsWith('Kab-')).length}`);
console.log(`📊 Total rute kabupaten: ${trayekAngkot.filter(t => t.kode.startsWith('Kab-')).length}`);
console.log(`📊 Total keseluruhan: ${trayekAngkot.length} rute`);
console.log(`📊 Total alias lokasi: ${Object.keys(aliasLokasi).length} titik`);
console.log(`\n📄 File tersimpan di: ${outputPath}`);

// List semua kode rute
console.log('\n📋 Daftar kode rute yang berhasil diparse:');
trayekAngkot.forEach(t => {
    console.log(`   ${t.kode.padEnd(15)} | ${t.nama.substring(0, 50)}`);
});

// Helper function
function capitalizeWords(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}
