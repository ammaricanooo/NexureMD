/**
 * Dataset Rute Angkot Bogor
 * Digenerate otomatis dari semua sumber di repositori michielbdejong/bogor-angkot-gtfs
 * Sumber: majalah transportasi, lovelybogor.com, 2menit.com, enterbogor, data Dishub Kab. Bogor
 * Total rute: 114
 * 
 * Untuk update ulang, jalankan: node scratch/parse-gtfs-full.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const customDataPath = path.join(__dirname, 'angkot-bogor-custom.json');

function loadCustomData() {
    try {
        const raw = fs.readFileSync(customDataPath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Failed to load angkot custom data:', err);
        }
        return { trayekAngkot: [], aliasLokasi: {}, deletedTrayekCodes: [] };
    }
}

let customData = loadCustomData();

function mergeTrayekAngkot(base, custom) {
    const deletedCodes = new Set((custom?.deletedTrayekCodes || []).map(code => code.toUpperCase()));
    const map = new Map();
    base.forEach(trayek => map.set(trayek.kode?.toUpperCase?.() ?? trayek.kode, trayek));
    (custom || []).forEach(trayek => {
        if (trayek?.kode) {
            map.set(trayek.kode.toUpperCase(), trayek);
        }
    });
    return [...map.values()].filter(trayek => !deletedCodes.has(trayek.kode?.toUpperCase?.()));
}

const baseTrayekAngkot = [
  {
    "kode": "AK-01",
    "nama": "Terminal Merdeka - Cipaku - Cipinang Gading",
    "warna": "Biru",
    "rute": [
      "Terminal Merdeka",
      "JL.Dr.Semeru",
      "JL.Mawar",
      "JL.Merdeka",
      "JL.Moh A. Salmun",
      "Pasar Anyar Bogor",
      "PGN Bogor",
      "JL.Nyai Raja Permas",
      "Masjid Agung Bogor",
      "JL.Dewi Sartika",
      "Bank BRI Cabang Bogor",
      "JL.Kapten Muslihat",
      "Gedung DPRD Kota Bogor",
      "SMPN 1 Kota Bogor",
      "Gedung Kusnoto Bogor",
      "Gereja Zebaoth Bogor",
      "Istana Kepresidenan Bogor",
      "BTM Bogor Trade Mall",
      "Museum Zoologi Bogor",
      "JL.Ir.H.Juanda",
      "Pasar Bogor",
      "JL.Roda",
      "Gang Aut Bogor",
      "JL.Siliwangi",
      "JL.Batu Tulis",
      "Stasiun Batutulis Bogor",
      "JL Raya Cipaku",
      "JL.RE.Soemanta Diredja",
      "Cipinang Gading"
    ],
    "jarak_km": 17.4,
    "waktu_menit": 73,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah, lovelybogor, enterbogor)"
  },
  {
    "kode": "AK-01A",
    "nama": "Baranangsiang - Tajur - Ciawi",
    "warna": "Hijau",
    "rute": [
      "Baranangsiang",
      "JL.Bangka",
      "JL.Otista",
      "Pajajaran",
      "JL. Raya Tajur",
      "Ciawi"
    ],
    "jarak_km": 3.6,
    "waktu_menit": 15,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, 2menit)"
  },
  {
    "kode": "AK-02",
    "nama": "Terminal Bubulak - Sukasari",
    "warna": "Orange",
    "rute": [
      "Terminal Bubulak",
      "JL.Letjen Ibrahim Adjie",
      "Pasar Laladon",
      "Terminal Laladon",
      "Perumahan Sindang Barang Asri",
      "Al Azhar Plus Bogor",
      "JL.Sindang Barang",
      "SMP SMA SMK Pembangunan 1 Bogor",
      "Komplek Pertanian Loji",
      "Pondok Pesantren Al Falak Pagentongan Loji Bogor",
      "Komplek Batalyon Infanteri 315 Garuda Bogor",
      "Pusat Pendidikan Dan Pelatihan Kehutanan Bogor",
      "JL.Mayjen Ishak Djuarsa",
      "Pasar Gunung Batu",
      "JL.Gunung Batu",
      "Badan Penelitian Dan Pengembangan Kehutanan Bogor",
      "Mall BTW Bogor Trade World",
      "Plaza Jembatan Merah",
      "JL.Perintis Kemerdekaan",
      "Pusat Grosir Bogor PGB Merdeka",
      "JL.Merdeka",
      "Jembatan Merah Bogor",
      "Stasiun Bogor",
      "Taman Topi Square",
      "Polres Bogor Kota",
      "JL.Kapten Muslihat",
      "Gedung DPRD Kota Bogor",
      "SMPN 1 Kota Bogor",
      "Gedung Kusnoto Bogor",
      "Gereja Zebaoth Bogor",
      "Istana Kepresidenan Bogor",
      "BTM Bogor Trade Mall",
      "Museum Zoologi Bogor",
      "JL.Ir.H.Juanda",
      "Balai Besar Industri Agro Bogor",
      "Kebon Raya Bogor",
      "Plaza Bogor",
      "JL.Surya Kencana",
      "Rumah Sakit Vania Bogor",
      "JL.Siliwangi",
      "Sukasari"
    ],
    "jarak_km": 24.6,
    "waktu_menit": 103,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit, enterbogor)"
  },
  {
    "kode": "AK-03",
    "nama": "Terminal Baranangsiang - Terminal Bubulak",
    "warna": "Biru",
    "rute": [
      "Terminal Baranangsiang, Botani Square",
      "JL.Bangka",
      "Tugu Kujang Bogor",
      "Kampus IPB Pajajaran",
      "JL.Raya Pajajaran",
      "Rumah Sakit PMI Bogor",
      "JL.Jalak Harupat",
      "Lapangan Sempur Bogor",
      "JL.Ir.H.Juanda",
      "Kejaksaan Negeri Bogor",
      "Hotel Salak The Heritage Bogor",
      "Kantor Walikota Bogor",
      "Gedung DPRD Kota Bogor",
      "JL.Kapten Muslihat",
      "Polres Bogor Kota",
      "Taman Topi Square",
      "Stasiun Bogor",
      "Kantor PLN Bogor Kota",
      "Jembatan Merah Bogor",
      "Plaza Jembatan Merah",
      "Mall BTW Bogor Trade World",
      "JL.Gunung Batu",
      "Badan Penelitian Dan Pengembangan Kehutanan Bogor",
      "Pasar Gunung Batu",
      "JL.Mayjen Ishak Djuarsa",
      "Pusat Pendidikan Dan Pelatihan Kehutanan Bogor",
      "Komplek Batalyon Infanteri 315 Garuda Bogor",
      "Pondok Pesantren Al Falak Pagentongan Loji Bogor",
      "Komplek Pertanian Loji",
      "SMP SMA SMK Pembangunan 1 Bogor",
      "JL.Sindang Barang",
      "Al Azhar Plus Bogor",
      "Perumahan Sindang Barang Asri",
      "Terminal Laladon",
      "Pasar Laladon",
      "JL.Letjen Ibrahim Adjie",
      "JL.K.H.Abdullah Bin Nuh",
      "Terminal Bubulak"
    ],
    "jarak_km": 22.8,
    "waktu_menit": 95,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit, enterbogor)"
  },
  {
    "kode": "AK-04",
    "nama": "Warung Nangka - Rancamaya - Ramayana",
    "warna": "Biru",
    "rute": [
      "Warung Nangka",
      "JL. Raya Rancamaya",
      "Terminal Agribisnis Kota Bogor",
      "Perumahan Rivela Park Bogor",
      "JL.Raya Kertamaya",
      "Kantor Kelurahan Kertamaya",
      "JL.Raya Dekeng",
      "Pertigaan Pemakaman Umum Gunung Gadung Bogor",
      "JL.Raya Cipaku",
      "Stasiun Batutulis Bogor",
      "Detour Road/ Cogreg",
      "JL.Pahlawan",
      "Gang Aut Bogor",
      "JL.Lawang Saketeng",
      "Ramayana"
    ],
    "jarak_km": 9,
    "waktu_menit": 38,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit)"
  },
  {
    "kode": "AK-05",
    "nama": "Cimahpar - Ramayana",
    "warna": "Ungu",
    "rute": [
      "JL.Parung Aleng",
      "JL.Cikeas Raya",
      "Cimahpar",
      "JL.Sukaraja",
      "Perumahan Griya Soka Bogor Raya 2",
      "Cico Resort Bogor",
      "JL.Tumenggung Wiradiredja",
      "Perumahan Botanica Cimahpar",
      "Perumahan Haji Kota Bogor",
      "Taman Parahyangan 1 Bogor",
      "SD Negeri Cimahpar 1",
      "Pasar Tanah Baru Bogor",
      "Gardu Induk PLN Bogor Baru",
      "JL.Kol Achmad Syam",
      "JL.R.H. Moh Tohir",
      "JL.Bogor Baru",
      "JL.Sancang",
      "JL.Kumbang",
      "JL.Lodaya",
      "JL.Pajajaran",
      "JL.Pangrango",
      "Gedung Radio RRI Bogor",
      "JL.Jalak Harupat",
      "JL.Ir.H.Juanda",
      "Kebun Raya Bogor",
      "BTM Bogor Trade Mall",
      "Ramayana"
    ],
    "jarak_km": 16.2,
    "waktu_menit": 68,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit, enterbogor)"
  },
  {
    "kode": "AK-06",
    "nama": "Ciheuleut - Ramayana",
    "warna": "Kuning",
    "rute": [
      "Ciheuleut",
      "JL.Pajajaran",
      "JL.Sambu",
      "JL.Bangka",
      "JL.Otista",
      "JL.Pajajaran",
      "JL.Jalak Harupat",
      "JL.Ir.H.Juanda",
      "Ramayana"
    ],
    "jarak_km": 5.4,
    "waktu_menit": 23,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit, enterbogor)"
  },
  {
    "kode": "AK-07",
    "nama": "Terminal Merdeka - Ciparigi",
    "warna": "Putih",
    "rute": [
      "Terminal Merdeka",
      "JL.Perintis Kemerdekaan",
      "JL.Mawar",
      "JL.Merdeka",
      "Kodam 3 Siliwangi Bogor",
      "Kampus BSI Bogor",
      "Perguruan Taman Siswa Bogor",
      "JL.RE Martadinata",
      "Balai Besar Penelitian Veteriner Bogor",
      "Polsek Bogor Tengah",
      "Taman Air Mancur Bogor",
      "JL.Jendral Ahmad Yani",
      "JL.Pemuda",
      "Global Halal Centre Bogor",
      "PT.GoodYear Indonesia Bogor",
      "Stadion Pajajaran Bogor",
      "Perpustakaan Kota Bogor",
      "Dinas Pendapatan Daerah Kota Bogor",
      "SMPN 12 Kota Bogor",
      "JL.Dadali",
      "KKP Pratama Ciawi",
      "Plaza Jambu Dua",
      "Warung Jambu",
      "Ciparigi",
      "Ada Yang Sampai Ke Kedung Halang Villa Bogor Indah."
    ],
    "jarak_km": 15,
    "waktu_menit": 63,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit)"
  },
  {
    "kode": "AK-07A",
    "nama": "Pasar Anyar - Pondok Rumput PP",
    "warna": "Hijau",
    "rute": [
      "Pasar Anyar",
      "JL.Pengadilan",
      "JL.Jend.Sudirman",
      "Air Mancur",
      "JL.RE Martadinata",
      "Pondok Rumput"
    ],
    "jarak_km": 3.6,
    "waktu_menit": 15,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, 2menit)"
  },
  {
    "kode": "AK-08",
    "nama": "Warung Jambu - Ramayana",
    "warna": "Merah",
    "rute": [
      "Warung Jambu",
      "JL. Raya Pajajaran",
      "Gedung Dinas Pendidikan Kota Bogor",
      "Galeri Indosat Ooredoo Bogor",
      "SMA Plus YPHB Bogor",
      "Arch Hotel Bogor",
      "Rumah Sakit RS. Azra Bogor",
      "Villa Indah Pajajaran Bogor",
      "SMK Negeri 3 Kota Bogor",
      "Kampus Pascasarjana MB IPB Bogor",
      "Gedung OPMC Bogor",
      "Kantor Telkom Bogor",
      "Hotel Pangrango 3 Bogor",
      "JL.Lodaya",
      "Kampus Diploma IPB Bogor",
      "JL.Kumbang",
      "STTIF Bogor",
      "JL.Jalak Harupat",
      "JL.Ir.H.Juanda",
      "Ramayana"
    ],
    "jarak_km": 12,
    "waktu_menit": 50,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit)"
  },
  {
    "kode": "AK-08A-23",
    "nama": "Ramayana - Taman Kencana - Warung Jambu",
    "warna": "Silver",
    "rute": [
      "Ramayana",
      "BTM",
      "Taman Kencana",
      "Warung Jambu"
    ],
    "jarak_km": 2.4,
    "waktu_menit": 10,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AK-09",
    "nama": "Ciparigi - Sukasari",
    "warna": "Ungu",
    "rute": [
      "Ciparigi",
      "Warung Jambu",
      "JL. Raya Pajajaran",
      "Gedung Dinas Pendidikan Kota Bogor",
      "Galeri Indosat Ooredoo Bogor",
      "SMA Plus YPHB Bogor",
      "Arch Hotel Bogor",
      "Rumah Sakit RS. Azra Bogor",
      "Villa Indah Pajajaran Bogor",
      "SMK Negeri 3 Kota Bogor",
      "Kampus Pascasarjana MB IPB Bogor",
      "Gedung OPMC Bogor",
      "Kantor Telkom Bogor",
      "Hotel Pangrango 3 Bogor",
      "Sukasari"
    ],
    "jarak_km": 9,
    "waktu_menit": 38,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit, enterbogor)"
  },
  {
    "kode": "AK-10",
    "nama": "Bantar Kemang - Sukasari - Terminal Merdeka",
    "warna": "Silver",
    "rute": [
      "Bantar Kemang",
      "JL.Pajajaran",
      "JL.Siliwangi",
      "JL.Lawang Gintung",
      "JL.Pahlawan",
      "JL.Empang",
      "JL.Ir.H.Juanda",
      "JL.Paledang",
      "JL.Veteran",
      "JL.Perintis Kemerdekaan",
      "Terminal Merdeka",
      "JL.Dr.Semeru",
      "JL.Mawar",
      "JL.Merdeka",
      "JL.Moh A. Salmun",
      "Pasar Anyar Bogor",
      "PGN Bogor",
      "JL.Nyai Raja Permas",
      "Masjid Agung Bogor",
      "JL.Dewi Sartika",
      "Bank BRI Cabang Bogor",
      "JL.Kapten Muslihat",
      "Gedung DPRD Kota Bogor",
      "Bantar Kemang"
    ],
    "jarak_km": 14.4,
    "waktu_menit": 60,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit, enterbogor)"
  },
  {
    "kode": "AK-11",
    "nama": "Pajajaran Indah - Pasar Bogor",
    "warna": "Coklat",
    "rute": [
      "Pajajaran Indah",
      "Villa Duta Bogor",
      "JL.Raya Pajajaran",
      "JL.Sambu",
      "JL.Bangka",
      "JL.Otista",
      "Pasar Bogor"
    ],
    "jarak_km": 4.2,
    "waktu_menit": 18,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit, enterbogor)"
  },
  {
    "kode": "AK-12",
    "nama": "Cimanggu - Pasar Anyar",
    "warna": "Kuning",
    "rute": [
      "Cimanggu Permai",
      "JL.Cimanggu",
      "JL.Merdeka",
      "JL. MA Salmun",
      "Pasar Anyar"
    ],
    "jarak_km": 3,
    "waktu_menit": 13,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit)"
  },
  {
    "kode": "AK-13",
    "nama": "Ramayana - Mutiara Bogor Raya/ Bantar Kemang",
    "warna": "Hijau",
    "rute": [
      "Ramayana",
      "Kebun Raya Bogor",
      "JL.Otto Iskandardinata",
      "Tugu Kujang Bogor",
      "Kampus IPB Bogr",
      "Botani Square",
      "Terminal Baranangsiang",
      "JL.Raya Pajajaran",
      "Puri Begawan Bogor Wedding",
      "Amaris Hotel Pakuan Bogor",
      "Bale Binarum Bogor",
      "JL.Durian Raya",
      "Kampus 1 Pondok Pesantren Modern Daarul Uluum Bogor",
      "JL.Rambutan",
      "Stasiun Tas Bogor",
      "SKI Tas Tajur",
      "JL.Raya Parung Banteng",
      "Mutiara Bogor Raya"
    ],
    "jarak_km": 10.8,
    "waktu_menit": 45,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit, enterbogor)"
  },
  {
    "kode": "AK-14",
    "nama": "Sukasari - Bubulak",
    "warna": "Hijau",
    "rute": [
      "Sukasari",
      "JL.Lawang Gintung",
      "JL.Pahlawan",
      "JL.Layungsari",
      "JL.Sadane",
      "JL.R.Aria Suriawinata",
      "JL.R.Aria Surialaga",
      "JL.R.E. Abdullah",
      "SMP SMA SMK Pembangunan 1 Bogor",
      "Komplek Pertanian Loji",
      "JL.Mayjen Ishak Djuarsa",
      "Terminal Laladon",
      "Pasar Laladon",
      "JL.Letjen Ibrahim Adjie",
      "JL.K.H.Abdullah Bin Nuh",
      "Terminal Bubulak"
    ],
    "jarak_km": 9.6,
    "waktu_menit": 40,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit)"
  },
  {
    "kode": "AK-15",
    "nama": "Terminal Merdeka - Bubulak SBJ Sindang Barang Jero",
    "warna": "Coklat",
    "rute": [
      "Terminal Merdeka",
      "JL.Dr.Sumeru",
      "SMP YKTB Bogor",
      "SMK YKTB Bogor",
      "Bogor Golf Club",
      "Rumah Sakit Dr.Marzoeki Mahdi Bogor",
      "Akademi Keperawatan Departemen Kesehatan Bogor",
      "RSUD Kota Bogor",
      "JL.Darul Quran",
      "Balai Pemasyarakatan Bogor",
      "Komplek Pertanian Loji",
      "SMP SMA SMK Pembangunan 1 Bogor",
      "JL.Sindang Barang",
      "Al Azhar Plus Bogor",
      "Terminal Laladon",
      "Pasar Laladon",
      "JL.Letjen Ibrahim Adjie",
      "JL.K.H.Abdullah Bin Nuh",
      "Terminal Bubulak"
    ],
    "jarak_km": 11.4,
    "waktu_menit": 48,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit)"
  },
  {
    "kode": "AK-16",
    "nama": "Pasar Anyar - Salabenda",
    "warna": "Putih",
    "rute": [
      "Pasar Anyar",
      "JL.Pengadilan",
      "Pengadilan Negeri Bogor",
      "SMA Regina Pacis Bogor",
      "JL.Jendral Sudirman Bogor",
      "Rumah Sakit RS.Salak Bogor",
      "Yogya Bogor Junction",
      "Gedung Wanita Bogor",
      "Kodim 0606 Kota Bogor",
      "Monumen Dan Museum PETA Bogor",
      "Pusat Pendidikan Zeni Bogor",
      "Taman Air Mancur Bogor",
      "JL.Pemuda",
      "Global Halal Centre Bogor",
      "PT.GoodYear Indonesia Bogor",
      "Stadion Pajajaran Bogor",
      "Perpustakaan Kota Bogor",
      "Dinas Pendapatan Daerah Kota Bogor",
      "SMPN 12 Kota Bogor",
      "Tanah Sereal Bogor",
      "SMK Tri Dharma 2 Bogor",
      "JL.Kebon Pedes",
      "JL. Soleh Iskandar",
      "UPBJJ Universitas Terbuka Bogor",
      "Griya Cimanggu Indah",
      "Universitas Ibn Khaldun Bogor",
      "Perumahan Budi Agung Bogor",
      "Bogor Square",
      "Bogor Icon",
      "Bukit Cimanggu City",
      "Pool Bus ALS Bogor",
      "Lotte Mart Bogor",
      "Kantor Pos Bogor",
      "RS.Bunda Suryatni Bogor",
      "Universitas Nusa Bangsa Bogor",
      "Perumahan Bogor Raya Permai",
      "Graha Dewi Sartika Bogor",
      "Taman Sari Persada Bogor",
      "Pertigaan Salabenda"
    ],
    "jarak_km": 23.4,
    "waktu_menit": 98,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit)"
  },
  {
    "kode": "AK-17",
    "nama": "Pomad - Tanah Baru - Bina Marga",
    "warna": "Hijau",
    "rute": [
      "Pomad",
      "JL.Pengera Sogiri (Tanah Baru)",
      "JL.R.Kan An",
      "Pasar Tanah Baru",
      "JL.Pandu Raya",
      "JL.Padi",
      "JL.Bina Marga"
    ],
    "jarak_km": 4.2,
    "waktu_menit": 18,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor, 2menit)"
  },
  {
    "kode": "AK-18",
    "nama": "Ramayana - Mulyaharja",
    "warna": "Hijau",
    "rute": [
      "Ramayana",
      "Empang",
      "Cibeureum",
      "Mulyaharja"
    ],
    "jarak_km": 2.4,
    "waktu_menit": 10,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor)"
  },
  {
    "kode": "AK-19",
    "nama": "Terminal Bubulak - Kencana",
    "warna": "Hijau",
    "rute": [
      "Terminal Bubulak",
      "JL.R",
      "1",
      "JL.Yasmin",
      "JL.Soleh Iskandar",
      "JL.Kayu Manis",
      "JL.Mekar Wangi",
      "Kencana"
    ],
    "jarak_km": 4.8,
    "waktu_menit": 20,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor)"
  },
  {
    "kode": "AK-20",
    "nama": "Pasar Anyar - Kencana",
    "warna": "Hijau",
    "rute": [
      "Pasar Anyar",
      "JL.Kebon Pedes",
      "JL.Soleh Iskandar",
      "Kencana"
    ],
    "jarak_km": 2.4,
    "waktu_menit": 10,
    "tarif": 4000,
    "keterangan": "Sumber: website (majalah, lovelybogor)"
  },
  {
    "kode": "AP-01",
    "nama": "Terminal Merdeka - Cipaku",
    "warna": "Biru",
    "rute": [
      "Terminal Merdeka",
      "Cipaku"
    ],
    "jarak_km": 1.2,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-02",
    "nama": "Sukasari - Cicurug",
    "warna": "Biru",
    "rute": [
      "Sukasari",
      "Jl.Siliwangi",
      "Jl.Raya Tajur",
      "Ciawi",
      "Cicurug"
    ],
    "jarak_km": 3,
    "waktu_menit": 13,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-02A",
    "nama": "Sukasari - Cisarua",
    "warna": "Biru",
    "rute": [
      "Sukasari",
      "Jl.Siliwangi",
      "Jl.Raya Tajur",
      "Cisarua"
    ],
    "jarak_km": 2.4,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-02B",
    "nama": "Sukasari - Cibedug",
    "warna": "Biru",
    "rute": [
      "Sukasari",
      "Jl.Siliwangi",
      "Jl.Raya Tajur",
      "Ciawi",
      "Cibedug"
    ],
    "jarak_km": 3,
    "waktu_menit": 13,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-03",
    "nama": "Ramayana - Ciapus",
    "warna": "Biru",
    "rute": [
      "Ramayana",
      "Jl.Otista",
      "Lw.Saketeng",
      "Jl.Lolongok",
      "Pulo Empang",
      "Ciapus"
    ],
    "jarak_km": 3.6,
    "waktu_menit": 15,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-04A",
    "nama": "Ramayana - Cihideung",
    "warna": "Biru",
    "rute": [
      "Ramayana",
      "Jl.Otista",
      "Lw.Saketeng",
      "Jl.Roda",
      "Jl.Raya Pahlawan",
      "Stasiun Batutulis Bogor",
      "Jl.Batu Tulis",
      "Cipaku",
      "Cihideung"
    ],
    "jarak_km": 5.4,
    "waktu_menit": 23,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-05A",
    "nama": "Terminal Merdeka - Ciomas",
    "warna": "Biru",
    "rute": [
      "Terminal Merdeka",
      "JL.Perintis Kemerdekaan",
      "Bogor Golf Club",
      "Rumah Sakit Dr.Marzoeki Mahdi Bogor",
      "Akademi Keperawatan Departemen Kesehatan Bogor",
      "RSUD Kota Bogor",
      "JL.Darul Quran",
      "Pasar Gunung Batu",
      "JL.Gunung Batu",
      "Ciomas"
    ],
    "jarak_km": 6,
    "waktu_menit": 25,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-06",
    "nama": "Terminal Merdeka - Parung",
    "warna": "Biru",
    "rute": [
      "Terminal Merdeka",
      "Jl.Dr.Semeru",
      "Semplak",
      "Pasar Parung"
    ],
    "jarak_km": 2.4,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-06A",
    "nama": "Terminal Merdeka - Bantar Kambing",
    "warna": "Biru",
    "rute": [
      "Terminal Merdeka",
      "Jl.Dr.Semeru",
      "Semplak",
      "Bantar Kambing"
    ],
    "jarak_km": 2.4,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-07",
    "nama": "Pasar Anyar - Bojong Gede",
    "warna": "Biru",
    "rute": [
      "Pasar Anyar",
      "JL.Pengadilan",
      "Pengadilan Negeri Bogor",
      "SMA Regina Pacis Bogor",
      "JL.Jendral Sudirman Bogor",
      "Rumah Sakit RS.Salak Bogor",
      "Yogya Bogor Junction",
      "Gedung Wanita Bogor",
      "Kodim 0606 Kota Bogor",
      "Monumen Dan Museum PETA Bogor",
      "Pusat Pendidikan Zeni Bogor",
      "Taman Air Mancur Bogor",
      "JL.Pemuda",
      "Global Halal Centre Bogor",
      "PT.GoodYear Indonesia Bogor",
      "Stadion Pajajaran Bogor",
      "Perpustakaan Kota Bogor",
      "Dinas Pendapatan Daerah Kota Bogor",
      "SMPN 12 Kota Bogor",
      "Tanah Sereal Bogor",
      "SMK Tri Dharma 2 Bogor",
      "JL.Kebon Pedes",
      "JL.Raya Cilebut",
      "PLN Gardu Induk Kedung Badak Bogor",
      "Pesona Intiland Cilebut",
      "Perumahan RS.PMI Bogor",
      "Stasiun Cilebut",
      "Stasiun Bojong Gede"
    ],
    "jarak_km": 16.8,
    "waktu_menit": 70,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-08",
    "nama": "Pasar Anyar - Citeureup",
    "warna": "Biru",
    "rute": [
      "Pasar Anyar",
      "JL.Pengadilan",
      "Pengadilan Negeri Bogor",
      "SMA Regina Pacis Bogor",
      "JL.Jendral Sudirman Bogor",
      "Rumah Sakit RS. Salak Bogor",
      "Yogya Bogor Junction",
      "Gedung Wanita Bogor",
      "Kodim 0606 Kota Bogor",
      "Monumen Dan Museum PETA Bogor",
      "Pusat Pendidikan Zeni Bogor",
      "Taman Air Mancur Bogor",
      "JL.Pemuda",
      "Global Halal Centre Bogor",
      "PT.GoodYear Indonesia Bogor",
      "Stadion Pajajaran Bogor",
      "Perpustakaan Kota Bogor",
      "Dinas Pendapatan Daerah Kota Bogor",
      "SMPN 12 Kota Bogor",
      "JL.Dadali",
      "KKP Pratama Ciawi",
      "Plaza Jambu Dua",
      "Warung Jambu",
      "JL.K.S Tubun",
      "Karoseri Delima Jaya Bogor",
      "JL.Raya Kedung Halang",
      "Polres Bogor Kota",
      "Badan Lingkungan Hidup Bogor",
      "Resimen II Korps Brimob Polri Bogor",
      "PT. Citra Abadi Sejati Kedung Halang Bogor",
      "Polsek Sukaraja Bogor",
      "Apartemen Gardenia Bogor",
      "Simpang Pomad Bogor",
      "Ruko Simpang Pomad",
      "JL.Raya Ciluar",
      "Pasar Ciluar Bogor",
      "PT. Galenium Pharmasia Bogor",
      "RS. Family Medical Center Bogor / RS.FMC Bogor",
      "JL.Raya Bogor",
      "DLLAJ Kabupaten Bogor",
      "M One Hotel Bogor",
      "Metro Residence Sentul Bogor",
      "Pusat Pengambangan Dan Pemasaran Ikan Hias Cibinong",
      "Hotel Taman Cibinong 2",
      "JL.Raya Bogor",
      "Komplek LIPI Cibinong",
      "PemKab Bogor / Pemda Cibinong",
      "Cibinong City Mall",
      "Cibinong Square",
      "Mall Cibinong City Point",
      "Robinson Cibinong",
      "Terminal Cibinong",
      "Fly Over Cibinong",
      "JL.Raya Mayor Oking",
      "Komplek Ruko Permata Cibinong",
      "SMP Negeri 1 Cibinong",
      "RS. Bina Husada Cibinong",
      "Cibinong Mall",
      "RS. Sentra Medika Cibinong",
      "Astra Kompenen Indonesia ASKI Cibinong",
      "Gerbang Tol Citeureup",
      "JL.Baru Puspa Negara",
      "SMA Indocement Citeureup",
      "Pasar Citeureup"
    ],
    "jarak_km": 38.4,
    "waktu_menit": 160,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-12",
    "nama": "Bojong Gede - Ciampea",
    "warna": "Biru",
    "rute": [
      "Stasiun Bojong Gede",
      "Tajur Halang",
      "Danau Tonjong",
      "Jalan Baru Kemang Bogor",
      "JL.Kemang Inpres",
      "JL.Situ Bakti Kemang",
      "Desa Pabuaran Kemang",
      "Kampung Cipanggulan Bogor",
      "JL.Dudung Sukarta Desa Candali Bogor",
      "JL.Sukajadi Desa Mekarsari Rancabungur Bogor",
      "JL.Raya Rancabungur Bogor",
      "Pusat Teknologi Satelit LAPAN Rancabungur Bogor",
      "Ciampea"
    ],
    "jarak_km": 7.8,
    "waktu_menit": 33,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-27",
    "nama": "Parung - BSD",
    "warna": "Biru",
    "rute": [
      "Pasar Parung",
      "JL.Permata",
      "Alfamart Distribution Center Parung",
      "Gunung Sindur",
      "Kantor Desa Curug Gunung Sindur",
      "Komplek Griya Cendekia Gunung Sindur",
      "JL.Mutiara",
      "JL.Pendidikan",
      "Rawa Kalong Gunung Sindur",
      "Perumahan Bukit Dago",
      "JL.Raya Pasar Jengkol",
      "Kantor Kelurahan Babakan Setu, Tangerang Selatan",
      "Perempatan Viktor",
      "Komplek Tropicana Residence Serpong",
      "JL. Raya Ciater",
      "BSD",
      "Buaran Serpong",
      "Pertigaan Taman Tekno Serpong",
      "Perumahan De Latinos Serpong",
      "JL.Raya Rawa Buntu",
      "Stasiun Rawa Buntu",
      "JL.Pelayangan",
      "Ruko Tol Boulevard BSD",
      "Giant BSD",
      "Taman Jajan BSD"
    ],
    "jarak_km": 15,
    "waktu_menit": 63,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-106",
    "nama": "Parung - Lebak Bulus",
    "warna": "Biru",
    "rute": [
      "Pasar Parung",
      "Ramayana Parung",
      "Cinangka",
      "Perempatan Gaplek",
      "Universitas Terbuka Pondok Cabe",
      "Bandara Pondok Cabe",
      "Cirendeu",
      "Lebak Bulus"
    ],
    "jarak_km": 4.8,
    "waktu_menit": 20,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-117",
    "nama": "arung - Bojong Gede",
    "warna": "Biru",
    "rute": [
      "Pasar Parung",
      "Sawangan Elok",
      "Pondok Pesantren Daarul Rahman III Sawangan",
      "ATC Area Trade Centre Parung",
      "Kantor Pos Parung",
      "JL.Raya Parung",
      "SMP SMA Proklamasi 1945 Parung",
      "Gedung P4TK Penjas Dan BK Parung Bogor",
      "Perumahan Permata Lebak Wangi",
      "JL.Arco Raya",
      "JL.Kalisuren Raya",
      "Pasar Modern Kalisuren",
      "Perumahan Inkopad Parung",
      "JL.Raya Tonjong",
      "Komplek BPN/DDN Tonjong",
      "Danau Tonjong Situ Tonjong",
      "Polsek Bojong Gede",
      "Bilabong Permai Bojong Gede Bogor",
      "JL.Sudi Mampir",
      "SDN Cimanggis 1 Bojong Gede",
      "Puskesmas Kemuning Bojong Gede",
      "Perumahan Surya Regency Cimanggis Bojong Gede",
      "JL.Kedungwaringin Cimanggis",
      "Madrasah Tsanawiyah Bahrul Ulum Bojong Gede",
      "Situ Kemuning Bogor",
      "Perumahan Waringin Elok Bojong Gede",
      "SMP Negeri 1 Bojong Gede",
      "Perumahan Bukit Waringin Bojong Gede",
      "JL.Kedung Waringin",
      "JL.Raya Bojong Gede",
      "Stasiu Bojong Gede"
    ],
    "jarak_km": 18.6,
    "waktu_menit": 78,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-53",
    "nama": "Terminal Laladon - Segog - Gunung Salak",
    "warna": "Biru",
    "rute": [
      "Terminal Laladon",
      "Pasar Laladon",
      "Segog",
      "Gunung Salak"
    ],
    "jarak_km": 2.4,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-32",
    "nama": "Taman Pagelaran Ciomas - Cibinong",
    "warna": "Biru",
    "rute": [
      "JL.Rajawali",
      "Perum Taman Pagelaran Ciomas",
      "JL.Raya Taman Pagelaran",
      "Griya Laladon Grande",
      "SMK Negeri 1 Ciomas",
      "Komplek Laladon Permai",
      "Terminal Laladon",
      "Pasar Laladon",
      "JL.Letjen Ibrahim Adjie",
      "JL.K.H.Abdullah Bin Nuh",
      "Terminal Bubulak",
      "JL.Raya Cibadak Ciampea",
      "Perempatan Lampu Merah Semplak Bogor",
      "SMK YKTB 1 Bogor",
      "Taman Yasmin",
      "Rumah Sakit Hermina Bogor",
      "Taman Cimanggu Bogor",
      "Lotte Mart Bogor",
      "JL.KH. Soleh Iskandar Pool Bus ALS Bogor",
      "Bukit Cimanggu City",
      "Bogor Icon",
      "Bogor Square",
      "Perumahan Budi Agung Bogor",
      "Universitas Ibn Khaldun Bogor",
      "Griya Cimanggu Indah",
      "UPBJJ Universitas Terbuka Bogor",
      "Perumahan Duta Kencana 2 Bogor",
      "Karoseri Delima Jaya Bogor",
      "JL.Raya Bogor",
      "JL.Kedung Halang",
      "Kantor Kelurahan Kedung Halang",
      "Villa Bogor Indah Kedung Halang",
      "JL.Raya Pemda",
      "SMK Bina Mandiri Bogor",
      "Madrasah Aliyah Sirojul Falah",
      "SMA Negeri 2 Cibinong",
      "JL.Raya Karadenan",
      "SMK Negeri 1 Cibinong",
      "Sekolah Islam Terpadu Al Madinah Cibinong",
      "Perumahan Acropolis Cibinong",
      "JL.Raya Sukahati",
      "Bogor Gading Residence",
      "Perempatan Pemda Cibinong",
      "JL.KSR Dadi Kusmayadi",
      "Pengadilan Agama Cibinong",
      "KPP Pratama Cibinong",
      "RSUD Cibinong",
      "Setu Cikaret Danau Cikaret Cibinong",
      "JL.Raya Cikaret",
      "JL.Raya Bogor",
      "Mall Cibinong City Point",
      "Robinson Cibinong",
      "Terminal Cibinong"
    ],
    "jarak_km": 31.8,
    "waktu_menit": 133,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-31",
    "nama": "Bojong Gede - Ciluar",
    "warna": "Biru",
    "rute": [
      "Stasiun Bojong Gede",
      "Perumahan Gaperi",
      "Ciluar"
    ],
    "jarak_km": 1.8,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-34",
    "nama": "Bambu Kuning - Gerbang Depan Pemda Cibinong",
    "warna": "Biru",
    "rute": [
      "Pertigaan Bambu Kuning Bojonggede/ Pertigaan Jalan Baru Pemda Cibinong",
      "JL.Raya Tegar Beriman",
      "Komplek Pemda Cibinong",
      "Cibinong City Mall"
    ],
    "jarak_km": 2.4,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-35",
    "nama": "Bambu Kuning - Cibinong",
    "warna": "Biru",
    "rute": [
      "Pertigaan Bambu Kuning Bojonggede/ Pertigaan Jalan Baru Pemda Cibinong",
      "JL.Raya Tegar Beriman",
      "JL.Raya Sukahati",
      "JL.KSR Dadi Kusmayadi",
      "Pengadilan Agama Cibinong",
      "KPP Pratama Cibinong",
      "RSUD Cibinong",
      "Setu Cikaret Danau Cikaret Cibinong",
      "JL.Raya Cikaret",
      "JL.Raya Bogor",
      "Mall Cibinong City Point",
      "Robinson Cibinong",
      "Terminal Cibinong"
    ],
    "jarak_km": 7.8,
    "waktu_menit": 33,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AP-44",
    "nama": "Citeureup - Babakan Madang",
    "warna": "Biru",
    "rute": [
      "Citeureup",
      "Sentul City",
      "Babakan Madang"
    ],
    "jarak_km": 1.8,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "LB",
    "nama": "Leuwiliang - Bubulak Bogor",
    "warna": "Biru",
    "rute": [
      "Leuwiliang",
      "Bubulak Bogor"
    ],
    "jarak_km": 1.2,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "JB",
    "nama": "Jasinga - Bubulak",
    "warna": "Biru",
    "rute": [
      "Jasinga",
      "Bubulak"
    ],
    "jarak_km": 1.2,
    "waktu_menit": 10,
    "tarif": 6000,
    "keterangan": "Sumber: website (majalah)"
  },
  {
    "kode": "AK-01-A",
    "nama": "BARANANGSIANG – TAJUR – CIAWI PP.",
    "warna": "Hijau",
    "rute": [
      "Baranangsiang",
      "Jl.Bangka",
      "Jl.Otista",
      "Pajajaran",
      "Jl.Tajur",
      "Ciawi"
    ],
    "jarak_km": 3.6,
    "waktu_menit": 15,
    "tarif": 4000,
    "keterangan": "Sumber: website (lovelybogor)"
  },
  {
    "kode": "AK-21",
    "nama": "Pasar Bogor-Taman Kencana-Ciremai Ujung",
    "warna": "Hijau",
    "rute": [
      "Pasar Bogor",
      "Taman Kencana",
      "Ciremai Ujung"
    ],
    "jarak_km": 1.8,
    "waktu_menit": 10,
    "tarif": 4000,
    "keterangan": "Sumber: website (lovelybogor, enterbogor)"
  },
  {
    "kode": "AK-22",
    "nama": "PASAR ANYAR – PONDOK RUMPUT PP.",
    "warna": "Hijau",
    "rute": [
      "Pondok Rumput",
      "Jl.Re Martadinata",
      "Air Mancur",
      "Jl. Jend. Sudirman",
      "Jl.Sawojajar",
      "Pasar Anyar"
    ],
    "jarak_km": 3.6,
    "waktu_menit": 15,
    "tarif": 4000,
    "keterangan": "Sumber: website (lovelybogor)"
  },
  {
    "kode": "AK-23",
    "nama": "RAMAYANA – TAMAN KENCANA – WARUNG JAMBU",
    "warna": "Hijau",
    "rute": [
      "Ramayana",
      "Taman Kencana",
      "Warung Jambu"
    ],
    "jarak_km": 1.8,
    "waktu_menit": 10,
    "tarif": 4000,
    "keterangan": "Sumber: website (lovelybogor, enterbogor)"
  },
  {
    "kode": "AK-04A",
    "nama": "Cihideung – Ramayana",
    "warna": "Hijau",
    "rute": [
      "Cihideung",
      "Batutulis",
      "Gang Aut",
      "Pasar Cumpok",
      "Ramayana",
      "Empang",
      "Bondongan",
      "Pahlawan",
      "Batutulis",
      "Cihideung"
    ],
    "jarak_km": 6,
    "waktu_menit": 25,
    "tarif": 4000,
    "keterangan": "Sumber: website (2menit)"
  },
  {
    "kode": "AK-07_1",
    "nama": "",
    "warna": "Hijau",
    "rute": [
      "Ciparigi",
      "Jl. Raya Pemda",
      "Kedunghalang",
      "Simpang Talang",
      "Warung Jambu",
      "Jl. A. Yani",
      "Sudirman",
      "Jalak Harupat",
      "Pajajaran",
      "Otista",
      "Juanda"
    ],
    "jarak_km": 6.6,
    "waktu_menit": 28,
    "tarif": 4000,
    "keterangan": "Sumber: website (enterbogor)"
  },
  {
    "kode": "AK-07_2",
    "nama": "",
    "warna": "Hijau",
    "rute": [
      "Ciparigi",
      "Jl. Raya Pemda",
      "Kedunghalang",
      "Simpang Talang",
      "Warung Jambu",
      "Jl. A. Yani",
      "Air Mancur",
      "Jl. R.E Martadinata",
      "Jl. Merdeka",
      "Terminal Merdeka"
    ],
    "jarak_km": 6,
    "waktu_menit": 25,
    "tarif": 4000,
    "keterangan": "Sumber: website (enterbogor)"
  },
  {
    "kode": "AK-07_3",
    "nama": "",
    "warna": "Hijau",
    "rute": [
      "Ciparigi",
      "Jl. Raya Pemda",
      "Simpang Talang",
      "Warung Jambu",
      "Jl. A. Yani",
      "Sudirman",
      "Pemuda"
    ],
    "jarak_km": 4.2,
    "waktu_menit": 18,
    "tarif": 4000,
    "keterangan": "Sumber: website (enterbogor)"
  },
  {
    "kode": "Kab-11",
    "nama": "Terminal Leuwiliang – Terminal Ciampea",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Leuwiliang",
      "Terminal Ciampea"
    ],
    "jarak_km": 3,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-12",
    "nama": "Terminal Ciampea – Terminal Bojonggede",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Ciampea",
      "Ranca Bungur",
      "Candali",
      "Kemang",
      "Tonjong",
      "Pasar Salasa",
      "Susukan",
      "Perum Griya Yasa Lestari",
      "Terminal Bojonggede"
    ],
    "jarak_km": 13.5,
    "waktu_menit": 36,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-32",
    "nama": "Terminal Cibinong – Tmn.Pagelaran",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cibinong",
      "Cikaret",
      "Ds.Tengah",
      "Karadenan",
      "K.B. Talang",
      "K.B. Jl. S.Iskander",
      "K.B. Jl.Kh.Abd Bin Nuh",
      "Terminal Laladon",
      "Tmn.Pagelaran"
    ],
    "jarak_km": 13.5,
    "waktu_menit": 36,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-33",
    "nama": "Terminal Cibinong – Terminal Cileungsi",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cibinong",
      "Jl.Baru",
      "Jl.Raya Gn.Putri",
      "Cicadas",
      "Wanaherang",
      "Cikuda",
      "Terminal Cileungsi"
    ],
    "jarak_km": 10.5,
    "waktu_menit": 28,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-35",
    "nama": "Terminal Cibinong – Pangkalan Bambu Kuning",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cibinong",
      "Cikaret",
      "Rm.Sakit",
      "Ds.Tengah",
      "Btn",
      "Pdam",
      "Pangkalan Bambu Kuning"
    ],
    "jarak_km": 10.5,
    "waktu_menit": 28,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-38",
    "nama": "Terminal Cileungsi – Ds.Tengah (Pengadilan Agama)",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cileungsi",
      "Nagrak",
      "Wanaherang",
      "Jl.Raya Gn.Putri",
      "Citeureup",
      "Terminal Cibinong",
      "Ds.Tengah (Pengadilan Agama)"
    ],
    "jarak_km": 10.5,
    "waktu_menit": 28,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-64",
    "nama": "Terminal Cibinong – Terminal Jonggol",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cibinong",
      "Citeureup",
      "Jl.Raya Gn.Putri",
      "Proyek",
      "Cileungsi",
      "Terminal Jonggol"
    ],
    "jarak_km": 9,
    "waktu_menit": 24,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-65",
    "nama": "Terminal Cibinong – Terminal Cileungsi",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cibinong",
      "Citeureup",
      "Jl.Raya Gn.Putri",
      "Proyek",
      "Terminal Cileungsi"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-77",
    "nama": "Terminal Bojonggede – Terminal Laladon",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Bojonggede",
      "Billabong",
      "Villa Mutiara",
      "Bmw",
      "Prempatan Kayu Manis",
      "Selabanda",
      "Jl.Ry Semplak",
      "Jl.Abd B Nuh",
      "Terminal Laladon"
    ],
    "jarak_km": 13.5,
    "waktu_menit": 36,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-117",
    "nama": "Terminal Parung – Terminal Bojonggede",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Parung",
      "Sasak Panjang",
      "Terminal Bojonggede"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-05B_1",
    "nama": "Terminal Leuwiliang – Terminal Bubulak",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Leuwiliang",
      "Dramaga",
      "Terminal Bubulak"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-05B_2",
    "nama": "Terminal Leuwiliang – Terminal Laladon",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Leuwiliang",
      "Dramaga",
      "Terminal Laladon"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-05C_1",
    "nama": "Terminal Jasinga – Terminal Bubulak",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Jasinga",
      "Leuwiliang",
      "Terminal Bubulak"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-05C_2",
    "nama": "Terminal Jasinga – Terminal Laladon",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Jasinga",
      "Leuwiliang",
      "Terminal Laladon"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-T05",
    "nama": "Terminal Cileungsi – Terminal Laladon",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cileungsi",
      "Pintu Tol Cibubur",
      "Toll Jarorawi",
      "Pintu Toll Sentul City",
      "Borr",
      "K.B. Jl.S. Iskander",
      "K.B. Jl.Kh.Abd Bin Nuh",
      "Terminal Laladon"
    ],
    "jarak_km": 12,
    "waktu_menit": 32,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-I) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-13_1",
    "nama": "Terminal Laladon – Pangkalan Curug Luhur",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Laladon",
      "Cibanteng",
      "Situ Daun",
      "Gunung Malang",
      "Pangkalan Curug Luhur"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-13_2",
    "nama": "Terminal Bubulak – Pangkalan Curug Luhur",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Bubulak",
      "Cibanteng",
      "Situ Daun",
      "Gunung Malang",
      "Pangkalan Curug Luhur"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-14",
    "nama": "Terminal Laladon – Pangkalan Curug Luhur",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Laladon",
      "Pagelaran",
      "Cibinong",
      "Pangkalan Curug Luhur"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-15_1",
    "nama": "Terminal Laladon – Pangkalan Curug Nangka",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Laladon",
      "Dramaga",
      "Cibeureum",
      "Petir",
      "Cisasah",
      "Gondokilan",
      "Pangkalan Curug Nangka"
    ],
    "jarak_km": 10.5,
    "waktu_menit": 28,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-15_2",
    "nama": "Terminal Bubulak – Pangkalan Curug Nangka",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Bubulak",
      "Dramaga",
      "Cibeureum",
      "Petir",
      "Cisasah",
      "Gondokilan",
      "Pangkalan Curug Nangka"
    ],
    "jarak_km": 10.5,
    "waktu_menit": 28,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-16_1",
    "nama": "Terminal Laladon – Pangkalan Curug Nangka",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Laladon",
      "Ciherang",
      "Kuripan",
      "Nambo",
      "Pangkalan Curug Nangka"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-16_2",
    "nama": "Terminal Bubulak – Pangkalan Curug Nangka",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Bubulak",
      "Ciherang",
      "Kuripan",
      "Nambo",
      "Pangkalan Curug Nangka"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-17_1",
    "nama": "Terminal Laladon – Pangkalan Cangkrang",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Laladon",
      "Dramaga",
      "Kampus Ipb",
      "Cangkurawok",
      "Pangkalan Cangkrang"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-17_2",
    "nama": "Terminal Bubulak – Pangkalan Cangkrang",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Bubulak",
      "Dramaga",
      "Kampus Ipb",
      "Cangkurawok",
      "Pangkalan Cangkrang"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-22",
    "nama": "Terminal Jasinga – Pangkalan Tenjo",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Jasinga",
      "Pangkalan Tenjo"
    ],
    "jarak_km": 3,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-25",
    "nama": "Terminal Parung – Pangkalan Jampang",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Parung",
      "Ciseeng",
      "Babakan",
      "Pasar Selasa",
      "Pangkalan Jampang"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-26",
    "nama": "Terminal Parung – Pangkalan Ciseeng",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Parung",
      "Prungpung",
      "Pangkalan Ciseeng"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-27",
    "nama": "Terminal Parung – Pasar Selasa -Pangkalan Jampang",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Parung",
      "Ciseeng",
      "Babakan",
      "Pasar Selasa -Pangkalan Jampang"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-28",
    "nama": "Terminal Parung – Pangkalan Kuripan",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Parung",
      "Ciseeng",
      "Pangkalan Kuripan"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-30",
    "nama": "Terminal Parung – Pangkalan Tajur Halang",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Parung",
      "Lebak Wangi",
      "Arco",
      "Pangkalan Tajur Halang"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-31",
    "nama": "Pangkalan Pasar Ciluar – Pangkalan Perum Pura Bojonggede (Gaveri)",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Pangkalan Pasar Ciluar",
      "Smp Uswatan Hasanah",
      "Kandang Roda",
      "Muara Beres",
      "Slb",
      "Karadenan",
      "Pangkalan Perum Pura Bojonggede (Gaveri)"
    ],
    "jarak_km": 10.5,
    "waktu_menit": 28,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-34",
    "nama": "Pangkalan Bambu Kuning – Pangkalan Jl.Dr.Nurdin",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Pangkalan Bambu Kuning",
      "Ds.Tengah",
      "Jl.Bersih",
      "Jl.Tegar Beriman",
      "Daralon",
      "Asr.Angmor",
      "Pangkalan Jl.Dr.Nurdin"
    ],
    "jarak_km": 10.5,
    "waktu_menit": 28,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-40",
    "nama": "Terminal Cileungsi – Pangkalan Limusnunggal",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cileungsi",
      "Rawa Ingkik",
      "Perum Griya Alam Sentosa",
      "Pangkalan Limusnunggal"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-42",
    "nama": "Terminal Cileungsi – Pangkalan Situsari",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cileungsi",
      "Klapanunggal",
      "Bojong",
      "Cikahuripan",
      "Pangkalan Situsari"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-45",
    "nama": "Terminal Cileungsi – Pangkalan Perum Graha Prima",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cileungsi",
      "Samik",
      "Mampir",
      "Perum Puri Nyalindung",
      "Pangkalan Perum Graha Prima"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-46",
    "nama": "Terminal Jonggol – Pangkalan Citeureup",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Jonggol",
      "Terminal Cileungsi",
      "Proyek",
      "Jl.Raya Gn.Putri",
      "Pangkalan Citeureup"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-49",
    "nama": "Terminal Cileungsi – Pangkalan Bojong Kulur",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cileungsi",
      "Pasar Lama",
      "Nagrag",
      "Pangkalan Bojong Kulur"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-50_1",
    "nama": "Terminal Laladon – Pangkalan Tenjolaya",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Laladon",
      "Cinangneng",
      "Cibitung",
      "Tapos",
      "Pangkalan Tenjolaya"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-50_2",
    "nama": "Terminal Bubulak – Pangkalan Tenjolaya",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Bubulak",
      "Cinangneng",
      "Cibitung",
      "Tapos",
      "Pangkalan Tenjolaya"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-52",
    "nama": "Terminal Leuwiliang – Pangkalan Gn.Salak Endah",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Leuwiliang",
      "Cibatok",
      "Cimayang",
      "Cibeneng",
      "Gn.Picung",
      "Pangkalan Gn.Salak Endah"
    ],
    "jarak_km": 9,
    "waktu_menit": 24,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-53",
    "nama": "Terminal Laladon – Pangkalan Segog",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Laladon",
      "Cikampang",
      "Pangkalan Segog"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-60",
    "nama": "Terminal Cileungsi – Pangkalan Pasir Tanjung",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cileungsi",
      "Jonggol",
      "Pangkalan Pasir Tanjung"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-66",
    "nama": "Terminal Cibinong – Pangkalan Perum Gunung Putri",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cibinong",
      "Jl.Rh.Lukman",
      "Jl.Kayu Manis",
      "Jl.Dr.Nurdin",
      "Jl.Mayor Oking",
      "Jl.Kranggan",
      "Pangkalan Perum Gunung Putri"
    ],
    "jarak_km": 10.5,
    "waktu_menit": 28,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-68",
    "nama": "Terminal Cibinong – Pangkalan Sanding",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cibinong",
      "Tapos",
      "Leuwinanggung",
      "Pangkalan Sanding"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-71",
    "nama": "Terminal Cibinong – Pangkalan Kp.Bulak",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cibinong",
      "Cikaret",
      "Puri Nirwana II",
      "Al Falah",
      "Pangkalan Kp.Bulak"
    ],
    "jarak_km": 7.5,
    "waktu_menit": 20,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-72",
    "nama": "Terminal Cibinong – Pangkalan Kampung Sawah",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cibinong",
      "Cikaret",
      "Pangkalan Kampung Sawah"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-86",
    "nama": "Terminal Parung – Pangkalan Citeureup",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Parung",
      "Pangkalan Citeureup"
    ],
    "jarak_km": 3,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-88",
    "nama": "Kodim – Terminal Bojonggede",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Kodim",
      "Prempatan Bunda",
      "Slb",
      "Karadenan",
      "Pangkalan Perum Pura Bojonggede",
      "Terminal Bojonggede"
    ],
    "jarak_km": 9,
    "waktu_menit": 24,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-111",
    "nama": "Terminal Parung – Pangkalan Citayam",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Parung",
      "Arco",
      "Pangkalan Citayam"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-05_1",
    "nama": "Terminal Laladon – Pangkalan Gobang",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Laladon",
      "Dramaga",
      "Terminal Ciampea",
      "Pangkalan Gobang"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-05_2",
    "nama": "Terminal Bubulak – Pangkalan Gobang",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Bubulak",
      "Dramaga",
      "Terminal Ciampea",
      "Pangkalan Gobang"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-40A",
    "nama": "Terminal Cileungsi – Pangkalan Pasir Angin",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cileungsi",
      "Rawa Ingkik",
      "Pangkalan Pasir Angin"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-T.02",
    "nama": "Terminal Cileungsi – Pangkalan Ciawi",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Terminal Cileungsi",
      "Pintu Toll Cibubur",
      "Toll Jagowari",
      "Pangkalan Ciawi"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-II) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-02C",
    "nama": "Pangkalan Pasir Muncang – Pangkalan Ciawi",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Pangkalan Pasir Muncang",
      "Pangkalan Ciawi"
    ],
    "jarak_km": 3,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-III) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-37",
    "nama": "Pangkalan Pasar Ciluar – Pangkalan Cilebut",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Pangkalan Pasar Ciluar",
      "Simpang Pomad",
      "Pasir Jambu",
      "Pangkalan Cilebut"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-III) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-44",
    "nama": "Pangkalan Citeureup – Pangkalan Babakan Madang",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Pangkalan Citeureup",
      "Pangkalan Babakan Madang"
    ],
    "jarak_km": 3,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-III) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-112",
    "nama": "Pangkalan Jampang – Pangkalan Pabuaran",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Pangkalan Jampang",
      "Ciseeng",
      "Prungpung",
      "Pangkalan Pabuaran"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-III) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-44A",
    "nama": "Pangkalan Jl.Sirojul Munir – Pangkalan Wangun",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Pangkalan Jl.Sirojul Munir",
      "Bogor Asri",
      "Kandang Roda",
      "Jl.Baru",
      "Tol Jagorawi",
      "Sentul Selatan",
      "Babakan Madang",
      "Karang Tengah",
      "Pangkalan Wangun"
    ],
    "jarak_km": 13.5,
    "waktu_menit": 36,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-III) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-44B",
    "nama": "Pangkalan Citeureup – Pangkalan Cipanas",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Pangkalan Citeureup",
      "Babakan Madang",
      "Karan Tenga",
      "Pangkalan Cipanas"
    ],
    "jarak_km": 6,
    "waktu_menit": 16,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-III) – Sumber: Dinas Perhubungan Kab. Bogor"
  },
  {
    "kode": "Kab-T.02A",
    "nama": "Pangkalan Ciawi – Pangkalan Gunung Putri",
    "warna": "Biru (Kabupaten)",
    "rute": [
      "Pangkalan Ciawi",
      "Toll Jagorawi",
      "Pangkalan Gunung Putri"
    ],
    "jarak_km": 4.5,
    "waktu_menit": 15,
    "tarif": 7000,
    "keterangan": "Trayek Kabupaten Bogor (Kat.-III) – Sumber: Dinas Perhubungan Kab. Bogor"
  }
];

export const trayekAngkot = mergeTrayekAngkot(baseTrayekAngkot, customData.trayekAngkot || []);

const baseAliasLokasi = {
  "1": "1",
  "empang": "Empang",
  "pasar bogor": "Pasar Bogor",
  "pasar anyar": "Pasar Anyar",
  "btm": "BTM Bogor Trade Mall",
  "botani square": "Botani Square",
  "botanimall": "Botani Square",
  "taman kencana": "Taman Kencana",
  "pajajaran": "JL.Raya Pajajaran",
  "jl pajajaran": "JL.Raya Pajajaran",
  "merdeka": "JL.Merdeka",
  "terminal merdeka": "Terminal Merdeka",
  "ciawi": "Ciawi",
  "terminal ciawi": "Ciawi",
  "baranangsiang": "Terminal Baranangsiang",
  "terminal baranangsiang": "Terminal Baranangsiang",
  "bara": "Terminal Baranangsiang",
  "bubulak": "Terminal Bubulak",
  "terminal bubulak": "Terminal Bubulak",
  "laladon": "Terminal Laladon",
  "terminal laladon": "Terminal Laladon",
  "ciapus": "Ciapus",
  "ciomas": "Ciomas",
  "sukasari": "Sukasari",
  "ciparigi": "Ciparigi",
  "cimahpar": "Cimahpar",
  "warung jambu": "Warung Jambu",
  "warungjambu": "Warung Jambu",
  "bantar kemang": "Bantar Kemang",
  "bantarkemang": "Bantar Kemang",
  "ramayana": "Ramayana",
  "stasiun bogor": "Stasiun Bogor",
  "kebun raya": "Kebun Raya Bogor",
  "kebun raya bogor": "Kebun Raya Bogor",
  "gang aut": "Gang Aut",
  "gg aut": "Gang Aut",
  "gg.aut": "Gang Aut",
  "sindang barang": "JL.Sindang Barang",
  "sindangbarang": "JL.Sindang Barang",
  "lawang gintung": "JL.Lawang Gintung",
  "batutulis": "Stasiun Batutulis Bogor",
  "pomad": "Pomad",
  "mulyaharja": "Mulyaharja",
  "rancamaya": "Rancamaya",
  "cihideung": "Cihideung",
  "ciheuleut": "Ciheuleut",
  "cipaku": "Cipaku",
  "cipinang gading": "Cipinang Gading",
  "tajur": "JL.Raya Tajur",
  "kota batu": "Kota Batu",
  "kotabatu": "Kota Batu",
  "cikaret": "Cikaret",
  "bondongan": "Bondongan",
  "pasar cumpok": "Pasar Cumpok",
  "leuwiliang": "Leuwiliang",
  "jasinga": "Jasinga",
  "cibinong": "Terminal Cibinong",
  "terminal cibinong": "Terminal Cibinong",
  "cibeureum": "Cibeureum",
  "ciampea": "Ciampea",
  "terminal ciampea": "Ciampea",
  "jl.dr.semeru": "JL.Dr.Semeru",
  "jl.mawar": "JL.Mawar",
  "jl.merdeka": "JL.Merdeka",
  "jl.moh a. salmun": "JL.Moh A. Salmun",
  "pasar anyar bogor": "Pasar Anyar Bogor",
  "pgn bogor": "PGN Bogor",
  "jl.nyai raja permas": "JL.Nyai Raja Permas",
  "masjid agung bogor": "Masjid Agung Bogor",
  "jl.dewi sartika": "JL.Dewi Sartika",
  "bank bri cabang bogor": "Bank BRI Cabang Bogor",
  "jl.kapten muslihat": "JL.Kapten Muslihat",
  "gedung dprd kota bogor": "Gedung DPRD Kota Bogor",
  "smpn 1 kota bogor": "SMPN 1 Kota Bogor",
  "gedung kusnoto bogor": "Gedung Kusnoto Bogor",
  "gereja zebaoth bogor": "Gereja Zebaoth Bogor",
  "istana kepresidenan bogor": "Istana Kepresidenan Bogor",
  "btm bogor trade mall": "BTM Bogor Trade Mall",
  "museum zoologi bogor": "Museum Zoologi Bogor",
  "jl.ir.h.juanda": "JL.Ir.H.Juanda",
  "jl.roda": "JL.Roda",
  "gang aut bogor": "Gang Aut Bogor",
  "jl.siliwangi": "JL.Siliwangi",
  "jl.batu tulis": "JL.Batu Tulis",
  "stasiun batutulis bogor": "Stasiun Batutulis Bogor",
  "jl raya cipaku": "JL Raya Cipaku",
  "jl.re.soemanta diredja": "JL.RE.Soemanta Diredja",
  "jl.bangka": "JL.Bangka",
  "jl.otista": "JL.Otista",
  "jl. raya tajur": "JL. Raya Tajur",
  "jl.letjen ibrahim adjie": "JL.Letjen Ibrahim Adjie",
  "pasar laladon": "Pasar Laladon",
  "perumahan sindang barang asri": "Perumahan Sindang Barang Asri",
  "al azhar plus bogor": "Al Azhar Plus Bogor",
  "jl.sindang barang": "JL.Sindang Barang",
  "smp sma smk pembangunan 1 bogor": "SMP SMA SMK Pembangunan 1 Bogor",
  "komplek pertanian loji": "Komplek Pertanian Loji",
  "pondok pesantren al falak pagentongan loji bogor": "Pondok Pesantren Al Falak Pagentongan Loji Bogor",
  "komplek batalyon infanteri 315 garuda bogor": "Komplek Batalyon Infanteri 315 Garuda Bogor",
  "pusat pendidikan dan pelatihan kehutanan bogor": "Pusat Pendidikan Dan Pelatihan Kehutanan Bogor",
  "jl.mayjen ishak djuarsa": "JL.Mayjen Ishak Djuarsa",
  "pasar gunung batu": "Pasar Gunung Batu",
  "jl.gunung batu": "JL.Gunung Batu",
  "badan penelitian dan pengembangan kehutanan bogor": "Badan Penelitian Dan Pengembangan Kehutanan Bogor",
  "mall btw bogor trade world": "Mall BTW Bogor Trade World",
  "plaza jembatan merah": "Plaza Jembatan Merah",
  "jl.perintis kemerdekaan": "JL.Perintis Kemerdekaan",
  "pusat grosir bogor pgb merdeka": "Pusat Grosir Bogor PGB Merdeka",
  "jembatan merah bogor": "Jembatan Merah Bogor",
  "taman topi square": "Taman Topi Square",
  "polres bogor kota": "Polres Bogor Kota",
  "balai besar industri agro bogor": "Balai Besar Industri Agro Bogor",
  "kebon raya bogor": "Kebon Raya Bogor",
  "plaza bogor": "Plaza Bogor",
  "jl.surya kencana": "JL.Surya Kencana",
  "rumah sakit vania bogor": "Rumah Sakit Vania Bogor",
  "terminal baranangsiang, botani square": "Terminal Baranangsiang, Botani Square",
  "tugu kujang bogor": "Tugu Kujang Bogor",
  "kampus ipb pajajaran": "Kampus IPB Pajajaran",
  "jl.raya pajajaran": "JL.Raya Pajajaran",
  "rumah sakit pmi bogor": "Rumah Sakit PMI Bogor",
  "jl.jalak harupat": "JL.Jalak Harupat",
  "lapangan sempur bogor": "Lapangan Sempur Bogor",
  "kejaksaan negeri bogor": "Kejaksaan Negeri Bogor",
  "hotel salak the heritage bogor": "Hotel Salak The Heritage Bogor",
  "kantor walikota bogor": "Kantor Walikota Bogor",
  "kantor pln bogor kota": "Kantor PLN Bogor Kota",
  "jl.k.h.abdullah bin nuh": "JL.K.H.Abdullah Bin Nuh",
  "warung nangka": "Warung Nangka",
  "jl. raya rancamaya": "JL. Raya Rancamaya",
  "terminal agribisnis kota bogor": "Terminal Agribisnis Kota Bogor",
  "perumahan rivela park bogor": "Perumahan Rivela Park Bogor",
  "jl.raya kertamaya": "JL.Raya Kertamaya",
  "kantor kelurahan kertamaya": "Kantor Kelurahan Kertamaya",
  "jl.raya dekeng": "JL.Raya Dekeng",
  "pertigaan pemakaman umum gunung gadung bogor": "Pertigaan Pemakaman Umum Gunung Gadung Bogor",
  "jl.raya cipaku": "JL.Raya Cipaku",
  "detour road/ cogreg": "Detour Road/ Cogreg",
  "jl.pahlawan": "JL.Pahlawan",
  "jl.lawang saketeng": "JL.Lawang Saketeng",
  "jl.parung aleng": "JL.Parung Aleng",
  "jl.cikeas raya": "JL.Cikeas Raya",
  "jl.sukaraja": "JL.Sukaraja",
  "perumahan griya soka bogor raya 2": "Perumahan Griya Soka Bogor Raya 2",
  "cico resort bogor": "Cico Resort Bogor",
  "jl.tumenggung wiradiredja": "JL.Tumenggung Wiradiredja",
  "perumahan botanica cimahpar": "Perumahan Botanica Cimahpar",
  "perumahan haji kota bogor": "Perumahan Haji Kota Bogor",
  "taman parahyangan 1 bogor": "Taman Parahyangan 1 Bogor",
  "sd negeri cimahpar 1": "SD Negeri Cimahpar 1",
  "pasar tanah baru bogor": "Pasar Tanah Baru Bogor",
  "gardu induk pln bogor baru": "Gardu Induk PLN Bogor Baru",
  "jl.kol achmad syam": "JL.Kol Achmad Syam",
  "jl.r.h. moh tohir": "JL.R.H. Moh Tohir",
  "jl.bogor baru": "JL.Bogor Baru",
  "jl.sancang": "JL.Sancang",
  "jl.kumbang": "JL.Kumbang",
  "jl.lodaya": "JL.Lodaya",
  "jl.pajajaran": "JL.Pajajaran",
  "jl.pangrango": "JL.Pangrango",
  "gedung radio rri bogor": "Gedung Radio RRI Bogor",
  "jl.sambu": "JL.Sambu",
  "kodam 3 siliwangi bogor": "Kodam 3 Siliwangi Bogor",
  "kampus bsi bogor": "Kampus BSI Bogor",
  "perguruan taman siswa bogor": "Perguruan Taman Siswa Bogor",
  "jl.re martadinata": "JL.RE Martadinata",
  "balai besar penelitian veteriner bogor": "Balai Besar Penelitian Veteriner Bogor",
  "polsek bogor tengah": "Polsek Bogor Tengah",
  "taman air mancur bogor": "Taman Air Mancur Bogor",
  "jl.jendral ahmad yani": "JL.Jendral Ahmad Yani",
  "jl.pemuda": "JL.Pemuda",
  "global halal centre bogor": "Global Halal Centre Bogor",
  "pt.goodyear indonesia bogor": "PT.GoodYear Indonesia Bogor",
  "stadion pajajaran bogor": "Stadion Pajajaran Bogor",
  "perpustakaan kota bogor": "Perpustakaan Kota Bogor",
  "dinas pendapatan daerah kota bogor": "Dinas Pendapatan Daerah Kota Bogor",
  "smpn 12 kota bogor": "SMPN 12 Kota Bogor",
  "jl.dadali": "JL.Dadali",
  "kkp pratama ciawi": "KKP Pratama Ciawi",
  "plaza jambu dua": "Plaza Jambu Dua",
  "ada yang sampai ke kedung halang villa bogor indah.": "Ada Yang Sampai Ke Kedung Halang Villa Bogor Indah.",
  "jl.pengadilan": "JL.Pengadilan",
  "jl.jend.sudirman": "JL.Jend.Sudirman",
  "air mancur": "Air Mancur",
  "pondok rumput": "Pondok Rumput",
  "jl. raya pajajaran": "JL. Raya Pajajaran",
  "gedung dinas pendidikan kota bogor": "Gedung Dinas Pendidikan Kota Bogor",
  "galeri indosat ooredoo bogor": "Galeri Indosat Ooredoo Bogor",
  "sma plus yphb bogor": "SMA Plus YPHB Bogor",
  "arch hotel bogor": "Arch Hotel Bogor",
  "rumah sakit rs. azra bogor": "Rumah Sakit RS. Azra Bogor",
  "villa indah pajajaran bogor": "Villa Indah Pajajaran Bogor",
  "smk negeri 3 kota bogor": "SMK Negeri 3 Kota Bogor",
  "kampus pascasarjana mb ipb bogor": "Kampus Pascasarjana MB IPB Bogor",
  "gedung opmc bogor": "Gedung OPMC Bogor",
  "kantor telkom bogor": "Kantor Telkom Bogor",
  "hotel pangrango 3 bogor": "Hotel Pangrango 3 Bogor",
  "kampus diploma ipb bogor": "Kampus Diploma IPB Bogor",
  "sttif bogor": "STTIF Bogor",
  "jl.lawang gintung": "JL.Lawang Gintung",
  "jl.empang": "JL.Empang",
  "jl.paledang": "JL.Paledang",
  "jl.veteran": "JL.Veteran",
  "pajajaran indah": "Pajajaran Indah",
  "villa duta bogor": "Villa Duta Bogor",
  "cimanggu permai": "Cimanggu Permai",
  "jl.cimanggu": "JL.Cimanggu",
  "jl. ma salmun": "JL. MA Salmun",
  "jl.otto iskandardinata": "JL.Otto Iskandardinata",
  "kampus ipb bogr": "Kampus IPB Bogr",
  "puri begawan bogor wedding": "Puri Begawan Bogor Wedding",
  "amaris hotel pakuan bogor": "Amaris Hotel Pakuan Bogor",
  "bale binarum bogor": "Bale Binarum Bogor",
  "jl.durian raya": "JL.Durian Raya",
  "kampus 1 pondok pesantren modern daarul uluum bogor": "Kampus 1 Pondok Pesantren Modern Daarul Uluum Bogor",
  "jl.rambutan": "JL.Rambutan",
  "stasiun tas bogor": "Stasiun Tas Bogor",
  "ski tas tajur": "SKI Tas Tajur",
  "jl.raya parung banteng": "JL.Raya Parung Banteng",
  "mutiara bogor raya": "Mutiara Bogor Raya",
  "jl.layungsari": "JL.Layungsari",
  "jl.sadane": "JL.Sadane",
  "jl.r.aria suriawinata": "JL.R.Aria Suriawinata",
  "jl.r.aria surialaga": "JL.R.Aria Surialaga",
  "jl.r.e. abdullah": "JL.R.E. Abdullah",
  "jl.dr.sumeru": "JL.Dr.Sumeru",
  "smp yktb bogor": "SMP YKTB Bogor",
  "smk yktb bogor": "SMK YKTB Bogor",
  "bogor golf club": "Bogor Golf Club",
  "rumah sakit dr.marzoeki mahdi bogor": "Rumah Sakit Dr.Marzoeki Mahdi Bogor",
  "akademi keperawatan departemen kesehatan bogor": "Akademi Keperawatan Departemen Kesehatan Bogor",
  "rsud kota bogor": "RSUD Kota Bogor",
  "jl.darul quran": "JL.Darul Quran",
  "balai pemasyarakatan bogor": "Balai Pemasyarakatan Bogor",
  "pengadilan negeri bogor": "Pengadilan Negeri Bogor",
  "sma regina pacis bogor": "SMA Regina Pacis Bogor",
  "jl.jendral sudirman bogor": "JL.Jendral Sudirman Bogor",
  "rumah sakit rs.salak bogor": "Rumah Sakit RS.Salak Bogor",
  "yogya bogor junction": "Yogya Bogor Junction",
  "gedung wanita bogor": "Gedung Wanita Bogor",
  "kodim 0606 kota bogor": "Kodim 0606 Kota Bogor",
  "monumen dan museum peta bogor": "Monumen Dan Museum PETA Bogor",
  "pusat pendidikan zeni bogor": "Pusat Pendidikan Zeni Bogor",
  "tanah sereal bogor": "Tanah Sereal Bogor",
  "smk tri dharma 2 bogor": "SMK Tri Dharma 2 Bogor",
  "jl.kebon pedes": "JL.Kebon Pedes",
  "jl. soleh iskandar": "JL. Soleh Iskandar",
  "upbjj universitas terbuka bogor": "UPBJJ Universitas Terbuka Bogor",
  "griya cimanggu indah": "Griya Cimanggu Indah",
  "universitas ibn khaldun bogor": "Universitas Ibn Khaldun Bogor",
  "perumahan budi agung bogor": "Perumahan Budi Agung Bogor",
  "bogor square": "Bogor Square",
  "bogor icon": "Bogor Icon",
  "bukit cimanggu city": "Bukit Cimanggu City",
  "pool bus als bogor": "Pool Bus ALS Bogor",
  "lotte mart bogor": "Lotte Mart Bogor",
  "kantor pos bogor": "Kantor Pos Bogor",
  "rs.bunda suryatni bogor": "RS.Bunda Suryatni Bogor",
  "universitas nusa bangsa bogor": "Universitas Nusa Bangsa Bogor",
  "perumahan bogor raya permai": "Perumahan Bogor Raya Permai",
  "graha dewi sartika bogor": "Graha Dewi Sartika Bogor",
  "taman sari persada bogor": "Taman Sari Persada Bogor",
  "pertigaan salabenda": "Pertigaan Salabenda",
  "jl.pengera sogiri (tanah baru)": "JL.Pengera Sogiri (Tanah Baru)",
  "jl.r.kan an": "JL.R.Kan An",
  "pasar tanah baru": "Pasar Tanah Baru",
  "jl.pandu raya": "JL.Pandu Raya",
  "jl.padi": "JL.Padi",
  "jl.bina marga": "JL.Bina Marga",
  "jl.r": "JL.R",
  "jl.yasmin": "JL.Yasmin",
  "jl.soleh iskandar": "JL.Soleh Iskandar",
  "jl.kayu manis": "JL.Kayu Manis",
  "jl.mekar wangi": "JL.Mekar Wangi",
  "kencana": "Kencana",
  "jl.raya tajur": "Jl.Raya Tajur",
  "cicurug": "Cicurug",
  "cisarua": "Cisarua",
  "cibedug": "Cibedug",
  "lw.saketeng": "Lw.Saketeng",
  "jl.lolongok": "Jl.Lolongok",
  "pulo empang": "Pulo Empang",
  "jl.raya pahlawan": "Jl.Raya Pahlawan",
  "semplak": "Semplak",
  "pasar parung": "Pasar Parung",
  "bantar kambing": "Bantar Kambing",
  "jl.raya cilebut": "JL.Raya Cilebut",
  "pln gardu induk kedung badak bogor": "PLN Gardu Induk Kedung Badak Bogor",
  "pesona intiland cilebut": "Pesona Intiland Cilebut",
  "perumahan rs.pmi bogor": "Perumahan RS.PMI Bogor",
  "stasiun cilebut": "Stasiun Cilebut",
  "stasiun bojong gede": "Stasiun Bojong Gede",
  "rumah sakit rs. salak bogor": "Rumah Sakit RS. Salak Bogor",
  "jl.k.s tubun": "JL.K.S Tubun",
  "karoseri delima jaya bogor": "Karoseri Delima Jaya Bogor",
  "jl.raya kedung halang": "JL.Raya Kedung Halang",
  "badan lingkungan hidup bogor": "Badan Lingkungan Hidup Bogor",
  "resimen ii korps brimob polri bogor": "Resimen II Korps Brimob Polri Bogor",
  "pt. citra abadi sejati kedung halang bogor": "PT. Citra Abadi Sejati Kedung Halang Bogor",
  "polsek sukaraja bogor": "Polsek Sukaraja Bogor",
  "apartemen gardenia bogor": "Apartemen Gardenia Bogor",
  "simpang pomad bogor": "Simpang Pomad Bogor",
  "ruko simpang pomad": "Ruko Simpang Pomad",
  "jl.raya ciluar": "JL.Raya Ciluar",
  "pasar ciluar bogor": "Pasar Ciluar Bogor",
  "pt. galenium pharmasia bogor": "PT. Galenium Pharmasia Bogor",
  "rs. family medical center bogor / rs.fmc bogor": "RS. Family Medical Center Bogor / RS.FMC Bogor",
  "jl.raya bogor": "JL.Raya Bogor",
  "dllaj kabupaten bogor": "DLLAJ Kabupaten Bogor",
  "m one hotel bogor": "M One Hotel Bogor",
  "metro residence sentul bogor": "Metro Residence Sentul Bogor",
  "pusat pengambangan dan pemasaran ikan hias cibinong": "Pusat Pengambangan Dan Pemasaran Ikan Hias Cibinong",
  "hotel taman cibinong 2": "Hotel Taman Cibinong 2",
  "komplek lipi cibinong": "Komplek LIPI Cibinong",
  "pemkab bogor / pemda cibinong": "PemKab Bogor / Pemda Cibinong",
  "cibinong city mall": "Cibinong City Mall",
  "cibinong square": "Cibinong Square",
  "mall cibinong city point": "Mall Cibinong City Point",
  "robinson cibinong": "Robinson Cibinong",
  "fly over cibinong": "Fly Over Cibinong",
  "jl.raya mayor oking": "JL.Raya Mayor Oking",
  "komplek ruko permata cibinong": "Komplek Ruko Permata Cibinong",
  "smp negeri 1 cibinong": "SMP Negeri 1 Cibinong",
  "rs. bina husada cibinong": "RS. Bina Husada Cibinong",
  "cibinong mall": "Cibinong Mall",
  "rs. sentra medika cibinong": "RS. Sentra Medika Cibinong",
  "astra kompenen indonesia aski cibinong": "Astra Kompenen Indonesia ASKI Cibinong",
  "gerbang tol citeureup": "Gerbang Tol Citeureup",
  "jl.baru puspa negara": "JL.Baru Puspa Negara",
  "sma indocement citeureup": "SMA Indocement Citeureup",
  "pasar citeureup": "Pasar Citeureup",
  "tajur halang": "Tajur Halang",
  "danau tonjong": "Danau Tonjong",
  "jalan baru kemang bogor": "Jalan Baru Kemang Bogor",
  "jl.kemang inpres": "JL.Kemang Inpres",
  "jl.situ bakti kemang": "JL.Situ Bakti Kemang",
  "desa pabuaran kemang": "Desa Pabuaran Kemang",
  "kampung cipanggulan bogor": "Kampung Cipanggulan Bogor",
  "jl.dudung sukarta desa candali bogor": "JL.Dudung Sukarta Desa Candali Bogor",
  "jl.sukajadi desa mekarsari rancabungur bogor": "JL.Sukajadi Desa Mekarsari Rancabungur Bogor",
  "jl.raya rancabungur bogor": "JL.Raya Rancabungur Bogor",
  "pusat teknologi satelit lapan rancabungur bogor": "Pusat Teknologi Satelit LAPAN Rancabungur Bogor",
  "jl.permata": "JL.Permata",
  "alfamart distribution center parung": "Alfamart Distribution Center Parung",
  "gunung sindur": "Gunung Sindur",
  "kantor desa curug gunung sindur": "Kantor Desa Curug Gunung Sindur",
  "komplek griya cendekia gunung sindur": "Komplek Griya Cendekia Gunung Sindur",
  "jl.mutiara": "JL.Mutiara",
  "jl.pendidikan": "JL.Pendidikan",
  "rawa kalong gunung sindur": "Rawa Kalong Gunung Sindur",
  "perumahan bukit dago": "Perumahan Bukit Dago",
  "jl.raya pasar jengkol": "JL.Raya Pasar Jengkol",
  "kantor kelurahan babakan setu, tangerang selatan": "Kantor Kelurahan Babakan Setu, Tangerang Selatan",
  "perempatan viktor": "Perempatan Viktor",
  "komplek tropicana residence serpong": "Komplek Tropicana Residence Serpong",
  "jl. raya ciater": "JL. Raya Ciater",
  "bsd": "BSD",
  "buaran serpong": "Buaran Serpong",
  "pertigaan taman tekno serpong": "Pertigaan Taman Tekno Serpong",
  "perumahan de latinos serpong": "Perumahan De Latinos Serpong",
  "jl.raya rawa buntu": "JL.Raya Rawa Buntu",
  "stasiun rawa buntu": "Stasiun Rawa Buntu",
  "jl.pelayangan": "JL.Pelayangan",
  "ruko tol boulevard bsd": "Ruko Tol Boulevard BSD",
  "giant bsd": "Giant BSD",
  "taman jajan bsd": "Taman Jajan BSD",
  "ramayana parung": "Ramayana Parung",
  "cinangka": "Cinangka",
  "perempatan gaplek": "Perempatan Gaplek",
  "universitas terbuka pondok cabe": "Universitas Terbuka Pondok Cabe",
  "bandara pondok cabe": "Bandara Pondok Cabe",
  "cirendeu": "Cirendeu",
  "lebak bulus": "Lebak Bulus",
  "sawangan elok": "Sawangan Elok",
  "pondok pesantren daarul rahman iii sawangan": "Pondok Pesantren Daarul Rahman III Sawangan",
  "atc area trade centre parung": "ATC Area Trade Centre Parung",
  "kantor pos parung": "Kantor Pos Parung",
  "jl.raya parung": "JL.Raya Parung",
  "smp sma proklamasi 1945 parung": "SMP SMA Proklamasi 1945 Parung",
  "gedung p4tk penjas dan bk parung bogor": "Gedung P4TK Penjas Dan BK Parung Bogor",
  "perumahan permata lebak wangi": "Perumahan Permata Lebak Wangi",
  "jl.arco raya": "JL.Arco Raya",
  "jl.kalisuren raya": "JL.Kalisuren Raya",
  "pasar modern kalisuren": "Pasar Modern Kalisuren",
  "perumahan inkopad parung": "Perumahan Inkopad Parung",
  "jl.raya tonjong": "JL.Raya Tonjong",
  "komplek bpn/ddn tonjong": "Komplek BPN/DDN Tonjong",
  "danau tonjong situ tonjong": "Danau Tonjong Situ Tonjong",
  "polsek bojong gede": "Polsek Bojong Gede",
  "bilabong permai bojong gede bogor": "Bilabong Permai Bojong Gede Bogor",
  "jl.sudi mampir": "JL.Sudi Mampir",
  "sdn cimanggis 1 bojong gede": "SDN Cimanggis 1 Bojong Gede",
  "puskesmas kemuning bojong gede": "Puskesmas Kemuning Bojong Gede",
  "perumahan surya regency cimanggis bojong gede": "Perumahan Surya Regency Cimanggis Bojong Gede",
  "jl.kedungwaringin cimanggis": "JL.Kedungwaringin Cimanggis",
  "madrasah tsanawiyah bahrul ulum bojong gede": "Madrasah Tsanawiyah Bahrul Ulum Bojong Gede",
  "situ kemuning bogor": "Situ Kemuning Bogor",
  "perumahan waringin elok bojong gede": "Perumahan Waringin Elok Bojong Gede",
  "smp negeri 1 bojong gede": "SMP Negeri 1 Bojong Gede",
  "perumahan bukit waringin bojong gede": "Perumahan Bukit Waringin Bojong Gede",
  "jl.kedung waringin": "JL.Kedung Waringin",
  "jl.raya bojong gede": "JL.Raya Bojong Gede",
  "stasiu bojong gede": "Stasiu Bojong Gede",
  "segog": "Segog",
  "gunung salak": "Gunung Salak",
  "jl.rajawali": "JL.Rajawali",
  "perum taman pagelaran ciomas": "Perum Taman Pagelaran Ciomas",
  "jl.raya taman pagelaran": "JL.Raya Taman Pagelaran",
  "griya laladon grande": "Griya Laladon Grande",
  "smk negeri 1 ciomas": "SMK Negeri 1 Ciomas",
  "komplek laladon permai": "Komplek Laladon Permai",
  "jl.raya cibadak ciampea": "JL.Raya Cibadak Ciampea",
  "perempatan lampu merah semplak bogor": "Perempatan Lampu Merah Semplak Bogor",
  "smk yktb 1 bogor": "SMK YKTB 1 Bogor",
  "taman yasmin": "Taman Yasmin",
  "rumah sakit hermina bogor": "Rumah Sakit Hermina Bogor",
  "taman cimanggu bogor": "Taman Cimanggu Bogor",
  "jl.kh. soleh iskandar pool bus als bogor": "JL.KH. Soleh Iskandar Pool Bus ALS Bogor",
  "perumahan duta kencana 2 bogor": "Perumahan Duta Kencana 2 Bogor",
  "jl.kedung halang": "JL.Kedung Halang",
  "kantor kelurahan kedung halang": "Kantor Kelurahan Kedung Halang",
  "villa bogor indah kedung halang": "Villa Bogor Indah Kedung Halang",
  "jl.raya pemda": "JL.Raya Pemda",
  "smk bina mandiri bogor": "SMK Bina Mandiri Bogor",
  "madrasah aliyah sirojul falah": "Madrasah Aliyah Sirojul Falah",
  "sma negeri 2 cibinong": "SMA Negeri 2 Cibinong",
  "jl.raya karadenan": "JL.Raya Karadenan",
  "smk negeri 1 cibinong": "SMK Negeri 1 Cibinong",
  "sekolah islam terpadu al madinah cibinong": "Sekolah Islam Terpadu Al Madinah Cibinong",
  "perumahan acropolis cibinong": "Perumahan Acropolis Cibinong",
  "jl.raya sukahati": "JL.Raya Sukahati",
  "bogor gading residence": "Bogor Gading Residence",
  "perempatan pemda cibinong": "Perempatan Pemda Cibinong",
  "jl.ksr dadi kusmayadi": "JL.KSR Dadi Kusmayadi",
  "pengadilan agama cibinong": "Pengadilan Agama Cibinong",
  "kpp pratama cibinong": "KPP Pratama Cibinong",
  "rsud cibinong": "RSUD Cibinong",
  "setu cikaret danau cikaret cibinong": "Setu Cikaret Danau Cikaret Cibinong",
  "jl.raya cikaret": "JL.Raya Cikaret",
  "perumahan gaperi": "Perumahan Gaperi",
  "ciluar": "Ciluar",
  "pertigaan bambu kuning bojonggede/ pertigaan jalan baru pemda cibinong": "Pertigaan Bambu Kuning Bojonggede/ Pertigaan Jalan Baru Pemda Cibinong",
  "jl.raya tegar beriman": "JL.Raya Tegar Beriman",
  "komplek pemda cibinong": "Komplek Pemda Cibinong",
  "citeureup": "Citeureup",
  "sentul city": "Sentul City",
  "babakan madang": "Babakan Madang",
  "bubulak bogor": "Bubulak Bogor",
  "jl.tajur": "Jl.Tajur",
  "ciremai ujung": "Ciremai Ujung",
  "jl. jend. sudirman": "Jl. Jend. Sudirman",
  "jl.sawojajar": "Jl.Sawojajar",
  "pahlawan": "Pahlawan",
  "jl. raya pemda": "Jl. Raya Pemda",
  "kedunghalang": "Kedunghalang",
  "simpang talang": "Simpang Talang",
  "jl. a. yani": "Jl. A. Yani",
  "sudirman": "Sudirman",
  "jalak harupat": "Jalak Harupat",
  "otista": "Otista",
  "juanda": "Juanda",
  "jl. r.e martadinata": "Jl. R.E Martadinata",
  "jl. merdeka": "Jl. Merdeka",
  "pemuda": "Pemuda",
  "terminal leuwiliang": "Terminal Leuwiliang",
  "ranca bungur": "Ranca Bungur",
  "candali": "Candali",
  "kemang": "Kemang",
  "tonjong": "Tonjong",
  "pasar salasa": "Pasar Salasa",
  "susukan": "Susukan",
  "perum griya yasa lestari": "Perum Griya Yasa Lestari",
  "terminal bojonggede": "Terminal Bojonggede",
  "ds.tengah": "Ds.Tengah",
  "karadenan": "Karadenan",
  "k.b. talang": "K.B. Talang",
  "k.b. jl. s.iskander": "K.B. Jl. S.Iskander",
  "k.b. jl.kh.abd bin nuh": "K.B. Jl.Kh.Abd Bin Nuh",
  "tmn.pagelaran": "Tmn.Pagelaran",
  "jl.baru": "Jl.Baru",
  "jl.raya gn.putri": "Jl.Raya Gn.Putri",
  "cicadas": "Cicadas",
  "wanaherang": "Wanaherang",
  "cikuda": "Cikuda",
  "terminal cileungsi": "Terminal Cileungsi",
  "rm.sakit": "Rm.Sakit",
  "btn": "Btn",
  "pdam": "Pdam",
  "pangkalan bambu kuning": "Pangkalan Bambu Kuning",
  "nagrak": "Nagrak",
  "ds.tengah (pengadilan agama)": "Ds.Tengah (Pengadilan Agama)",
  "proyek": "Proyek",
  "cileungsi": "Cileungsi",
  "terminal jonggol": "Terminal Jonggol",
  "billabong": "Billabong",
  "villa mutiara": "Villa Mutiara",
  "bmw": "Bmw",
  "prempatan kayu manis": "Prempatan Kayu Manis",
  "selabanda": "Selabanda",
  "jl.ry semplak": "Jl.Ry Semplak",
  "jl.abd b nuh": "Jl.Abd B Nuh",
  "terminal parung": "Terminal Parung",
  "sasak panjang": "Sasak Panjang",
  "dramaga": "Dramaga",
  "terminal jasinga": "Terminal Jasinga",
  "pintu tol cibubur": "Pintu Tol Cibubur",
  "toll jarorawi": "Toll Jarorawi",
  "pintu toll sentul city": "Pintu Toll Sentul City",
  "borr": "Borr",
  "k.b. jl.s. iskander": "K.B. Jl.S. Iskander",
  "cibanteng": "Cibanteng",
  "situ daun": "Situ Daun",
  "gunung malang": "Gunung Malang",
  "pangkalan curug luhur": "Pangkalan Curug Luhur",
  "pagelaran": "Pagelaran",
  "petir": "Petir",
  "cisasah": "Cisasah",
  "gondokilan": "Gondokilan",
  "pangkalan curug nangka": "Pangkalan Curug Nangka",
  "ciherang": "Ciherang",
  "kuripan": "Kuripan",
  "nambo": "Nambo",
  "kampus ipb": "Kampus Ipb",
  "cangkurawok": "Cangkurawok",
  "pangkalan cangkrang": "Pangkalan Cangkrang",
  "pangkalan tenjo": "Pangkalan Tenjo",
  "ciseeng": "Ciseeng",
  "babakan": "Babakan",
  "pasar selasa": "Pasar Selasa",
  "pangkalan jampang": "Pangkalan Jampang",
  "prungpung": "Prungpung",
  "pangkalan ciseeng": "Pangkalan Ciseeng",
  "pasar selasa -pangkalan jampang": "Pasar Selasa -Pangkalan Jampang",
  "pangkalan kuripan": "Pangkalan Kuripan",
  "lebak wangi": "Lebak Wangi",
  "arco": "Arco",
  "pangkalan tajur halang": "Pangkalan Tajur Halang",
  "pangkalan pasar ciluar": "Pangkalan Pasar Ciluar",
  "smp uswatan hasanah": "Smp Uswatan Hasanah",
  "kandang roda": "Kandang Roda",
  "muara beres": "Muara Beres",
  "slb": "Slb",
  "pangkalan perum pura bojonggede (gaveri)": "Pangkalan Perum Pura Bojonggede (Gaveri)",
  "jl.bersih": "Jl.Bersih",
  "jl.tegar beriman": "Jl.Tegar Beriman",
  "daralon": "Daralon",
  "asr.angmor": "Asr.Angmor",
  "pangkalan jl.dr.nurdin": "Pangkalan Jl.Dr.Nurdin",
  "rawa ingkik": "Rawa Ingkik",
  "perum griya alam sentosa": "Perum Griya Alam Sentosa",
  "pangkalan limusnunggal": "Pangkalan Limusnunggal",
  "klapanunggal": "Klapanunggal",
  "bojong": "Bojong",
  "cikahuripan": "Cikahuripan",
  "pangkalan situsari": "Pangkalan Situsari",
  "samik": "Samik",
  "mampir": "Mampir",
  "perum puri nyalindung": "Perum Puri Nyalindung",
  "pangkalan perum graha prima": "Pangkalan Perum Graha Prima",
  "pangkalan citeureup": "Pangkalan Citeureup",
  "pasar lama": "Pasar Lama",
  "nagrag": "Nagrag",
  "pangkalan bojong kulur": "Pangkalan Bojong Kulur",
  "cinangneng": "Cinangneng",
  "cibitung": "Cibitung",
  "tapos": "Tapos",
  "pangkalan tenjolaya": "Pangkalan Tenjolaya",
  "cibatok": "Cibatok",
  "cimayang": "Cimayang",
  "cibeneng": "Cibeneng",
  "gn.picung": "Gn.Picung",
  "pangkalan gn.salak endah": "Pangkalan Gn.Salak Endah",
  "cikampang": "Cikampang",
  "pangkalan segog": "Pangkalan Segog",
  "jonggol": "Jonggol",
  "pangkalan pasir tanjung": "Pangkalan Pasir Tanjung",
  "jl.rh.lukman": "Jl.Rh.Lukman",
  "jl.dr.nurdin": "Jl.Dr.Nurdin",
  "jl.mayor oking": "Jl.Mayor Oking",
  "jl.kranggan": "Jl.Kranggan",
  "pangkalan perum gunung putri": "Pangkalan Perum Gunung Putri",
  "leuwinanggung": "Leuwinanggung",
  "pangkalan sanding": "Pangkalan Sanding",
  "puri nirwana ii": "Puri Nirwana II",
  "al falah": "Al Falah",
  "pangkalan kp.bulak": "Pangkalan Kp.Bulak",
  "pangkalan kampung sawah": "Pangkalan Kampung Sawah",
  "kodim": "Kodim",
  "prempatan bunda": "Prempatan Bunda",
  "pangkalan perum pura bojonggede": "Pangkalan Perum Pura Bojonggede",
  "pangkalan citayam": "Pangkalan Citayam",
  "pangkalan gobang": "Pangkalan Gobang",
  "pangkalan pasir angin": "Pangkalan Pasir Angin",
  "pintu toll cibubur": "Pintu Toll Cibubur",
  "toll jagowari": "Toll Jagowari",
  "pangkalan ciawi": "Pangkalan Ciawi",
  "pangkalan pasir muncang": "Pangkalan Pasir Muncang",
  "simpang pomad": "Simpang Pomad",
  "pasir jambu": "Pasir Jambu",
  "pangkalan cilebut": "Pangkalan Cilebut",
  "pangkalan babakan madang": "Pangkalan Babakan Madang",
  "pangkalan pabuaran": "Pangkalan Pabuaran",
  "pangkalan jl.sirojul munir": "Pangkalan Jl.Sirojul Munir",
  "bogor asri": "Bogor Asri",
  "tol jagorawi": "Tol Jagorawi",
  "sentul selatan": "Sentul Selatan",
  "karang tengah": "Karang Tengah",
  "pangkalan wangun": "Pangkalan Wangun",
  "karan tenga": "Karan Tenga",
  "pangkalan cipanas": "Pangkalan Cipanas",
  "toll jagorawi": "Toll Jagorawi",
  "pangkalan gunung putri": "Pangkalan Gunung Putri"
};

export const aliasLokasi = {
    ...baseAliasLokasi,
    ...(customData.aliasLokasi || {})
};

export function refreshAngkotData() {
    customData = loadCustomData();
    trayekAngkot.length = 0;
    trayekAngkot.push(...mergeTrayekAngkot(baseTrayekAngkot, customData.trayekAngkot || []));
    Object.keys(aliasLokasi).forEach(key => delete aliasLokasi[key]);
    Object.assign(aliasLokasi, baseAliasLokasi, customData.aliasLokasi || {});
}

function simplifyLocation(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[.,/]+/g, ' ')
        .replace(/\b(jl|jalan|jln)\b/g, 'jalan')
        .replace(/\b(gn|gunung)\b/g, 'gunung')
        .replace(/\b(dr|drs?)\b/g, 'dr')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalisasiLokasi(input) {
    const lower = input.toLowerCase().trim();
    if (aliasLokasi[lower]) {
        return aliasLokasi[lower];
    }

    const simplified = simplifyLocation(lower);
    for (const key of Object.keys(aliasLokasi)) {
        if (simplifyLocation(key) === simplified) {
            return aliasLokasi[key];
        }
    }

    return capitalizeWords(simplified);
}

/**
 * Mencari trayek berdasarkan asal dan tujuan
 * @param {string} asal
 * @param {string} tujuan
 * @returns {{ langsung: Array, transfer: Array }}
 */
export function cariRute(asal, tujuan) {
    const normalAsal = normalisasiLokasi(asal);
    const normalTujuan = normalisasiLokasi(tujuan);

    const langsungRaw = [];
    const transferRaw = [];

    // Cari rute langsung
    for (const trayek of trayekAngkot) {
        const idxAsal = temukan(trayek.rute, normalAsal);
        const idxTujuan = temukan(trayek.rute, normalTujuan);

        if (idxAsal !== -1 && idxTujuan !== -1 && idxAsal !== idxTujuan) {
            const reversed = idxAsal > idxTujuan;
            langsungRaw.push({
                trayek,
                dariStop: trayek.rute[idxAsal],
                keStop: trayek.rute[idxTujuan],
                stops: reversed
                    ? trayek.rute.slice(idxTujuan, idxAsal + 1).reverse()
                    : trayek.rute.slice(idxAsal, idxTujuan + 1),
                reversed
            });
        }
    }

    // Deduplikasi Rute Langsung berdasarkan kode trayek
    const langsungMap = new Map();
    for (const item of langsungRaw) {
        const kode = item.trayek.kode;
        if (!langsungMap.has(kode)) {
            langsungMap.set(kode, item);
        } else {
            const existing = langsungMap.get(kode);
            if (item.stops.length < existing.stops.length) {
                langsungMap.set(kode, item);
            }
        }
    }
    const langsung = [...langsungMap.values()];

    // Cari rute transfer (ganti angkot 1x) jika tidak ada rute langsung
    if (langsung.length === 0) {
        for (const t1 of trayekAngkot) {
            const idxAsal1 = temukan(t1.rute, normalAsal);
            if (idxAsal1 === -1) continue;

            const candidateStops = t1.rute.filter((_, idx) => idx !== idxAsal1);
            for (const stopTransfer of candidateStops) {
                for (const t2 of trayekAngkot) {
                    if (t1.kode === t2.kode) continue;
                    const idxTransfer2 = temukan(t2.rute, stopTransfer);
                    const idxTujuan2 = temukan(t2.rute, normalTujuan);

                    if (idxTransfer2 !== -1 && idxTujuan2 !== -1 && idxTransfer2 !== idxTujuan2) {
                        const idxAsal1Real = temukan(t1.rute, normalAsal);
                        const idxTransfer1 = temukan(t1.rute, stopTransfer);

                        if (idxTransfer1 !== -1 && idxTransfer1 !== idxAsal1Real) {
                            const stops1 = idxTransfer1 > idxAsal1Real
                                ? t1.rute.slice(idxAsal1Real, idxTransfer1 + 1)
                                : t1.rute.slice(idxTransfer1, idxAsal1Real + 1).reverse();

                            const stops2 = idxTujuan2 > idxTransfer2
                                ? t2.rute.slice(idxTransfer2, idxTujuan2 + 1)
                                : t2.rute.slice(idxTujuan2, idxTransfer2 + 1).reverse();

                            transferRaw.push({
                                t1,
                                t2,
                                transfer: stopTransfer,
                                stops1,
                                stops2
                            });
                        }
                    }
                }
            }
        }

        // Deduplikasi Rute Transfer berdasarkan pasangan (t1.kode, t2.kode)
        const transferMap = new Map();
        for (const item of transferRaw) {
            const pairKey = `${item.t1.kode}->${item.t2.kode}`;
            const totalStops = item.stops1.length + item.stops2.length;

            if (!transferMap.has(pairKey)) {
                transferMap.set(pairKey, { item, totalStops });
            } else {
                if (totalStops < transferMap.get(pairKey).totalStops) {
                    transferMap.set(pairKey, { item, totalStops });
                }
            }
        }

        const transfer = [];
        for (const val of transferMap.values()) {
            transfer.push(val.item);
        }

        return { langsung, transfer: transfer.slice(0, 3) };
    }

    return { langsung, transfer: [] };
}

function temukan(rute, target) {
    const targetSimplified = simplifyLocation(target);
    if (!targetSimplified) return -1;

    // 1. Exact match
    const exactIdx = rute.findIndex(stop => simplifyLocation(stop) === targetSimplified);
    if (exactIdx !== -1) return exactIdx;

    // 2. Substring match
    if (targetSimplified.length >= 3) {
        const subIdx = rute.findIndex(stop => {
            const s = simplifyLocation(stop);
            return s.includes(targetSimplified) || targetSimplified.includes(s);
        });
        if (subIdx !== -1) return subIdx;
    }

    // 3. Multi-word Token Match
    const targetTokens = targetSimplified.split(' ').filter(t => t.length > 2);
    if (targetTokens.length > 0) {
        const tokenIdx = rute.findIndex(stop => {
            const s = simplifyLocation(stop);
            return targetTokens.every(tok => s.includes(tok));
        });
        if (tokenIdx !== -1) return tokenIdx;
    }

    return -1;
}

function capitalizeWords(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

