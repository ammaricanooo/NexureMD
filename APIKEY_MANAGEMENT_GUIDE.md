# 🔑 API Key Management Guide

Panduan lengkap untuk membuat, mengelola, dan menggunakan API Keys pada WhatsApp Gateway Bot.

---

## 📋 Daftar Isi

1. [Konsep & Keamanan](#konsep--keamanan)
2. [Commands](#commands)
3. [Workflow](#workflow)
4. [Troubleshooting](#troubleshooting)

---

## 🎯 Konsep & Keamanan

### Apa itu API Key?

API Key adalah token unik yang digunakan untuk mengautentikasi request ke WhatsApp Gateway API. Setiap key memiliki:

- **Nama** - Label untuk identifikasi (misal: "Web Platform", "Mobile App")
- **Full Key** - String random 64 karakter (hanya ditampilkan 1x saat creation)
- **Prefix** - Identitas singkat (misal: `sk_abcd1234...`)
- **Status** - Active/Inactive
- **Statistics** - Request count, last used, creation date

### Keamanan

✅ **Hash Storage** - Key disimpan dalam bentuk hash SHA256, bukan plaintext  
✅ **Unique** - Setiap key unique dan tidak bisa di-generate ulang  
✅ **Revocable** - Bisa di-disable atau dihapus kapan saja  
✅ **Traceable** - Semua request tercatat dengan API key yang digunakan  
✅ **Expirable** - Support tanggal expiration (optional)  

---

## 🛠️ Commands

### 1. Create API Key

Buat API Key baru untuk integrasi.

**Command:**
```
*.createapikey <nama>
```

**Contoh:**
```
*.createapikey Web Platform
*.createapikey Mobile App v2
*.createapikey Third Party Integration
```

**Response:**
```
✅ API Key Berhasil Dibuat!

Nama: Web Platform
Prefix: sk_abc12345...xxx

🔐 Full Key (simpan dengan aman):
sk_abc12345def67890ghijklmnopqrstuvwxyz1234567890abcdefghijklmno

⚠️ PENTING:
- Simpan key ini di tempat yang aman!
- Key hanya ditampilkan 1x saja
- Jangan bagikan key ke orang lain
- Untuk lihat semua key: *.listapikey

Gunakan pada API Gateway:
Header: x-api-key: sk_abc12345def...
```

---

### 2. List API Key

Lihat semua API Key yang sudah dibuat.

**Command:**
```
*.listapikey [filter]
```

**Opsi Filter:**
- `*.listapikey` - Lihat semua
- `*.listapikey active` - Hanya yang aktif
- `*.listapikey inactive` - Hanya yang nonaktif

**Response:**
```
🔐 Daftar API Key

╔════════════════════════════════════════╗
║ 1. Web Platform
║    ✅ sk_abc12345...xxx
║    Dibuat: 26/05/2026
║    Akses: 145x
║    Terakhir: 26/05/2026
║
║ 2. Mobile App v2
║    ❌ sk_def67890...xxx
║    Dibuat: 25/05/2026
║    Akses: 0x
║    Terakhir: Belum
║
╚════════════════════════════════════════╝

Total: 2 API Key

📋 Opsi:
*.createapikey <nama>  - Buat API Key baru
*.deleteapikey <nama>  - Hapus API Key
*.activeapikey <nama>  - Aktifkan API Key
*.deactiveapikey <nama> - Nonaktifkan API Key
```

---

### 3. Active API Key

Aktifkan API Key yang sedang nonaktif.

**Command:**
```
*.activeapikey <nama>
```

**Contoh:**
```
*.activeapikey Mobile App v2
```

**Response:**
```
✅ API Key Diaktifkan

Nama: Mobile App v2

Status: ✅ ACTIVE
Key sudah bisa digunakan pada API Gateway.
```

---

### 4. Deactive API Key

Nonaktifkan API Key tanpa menghapusnya.

**Command:**
```
*.deactiveapikey <nama>
```

**Contoh:**
```
*.deactiveapikey Mobile App v2
```

**Response:**
```
❌ API Key Dinonaktifkan

Nama: Mobile App v2

Status: ❌ INACTIVE
Key tidak bisa digunakan pada API Gateway.

Untuk mengaktifkan kembali:
*.activeapikey Mobile App v2
```

---

### 5. Delete API Key

Hapus API Key secara permanen.

**Command (Step 1):**
```
*.deleteapikey <nama>
```

**Contoh:**
```
*.deleteapikey Old Integration
```

**Response:**
```
⚠️ Konfirmasi Hapus API Key

Nama: Old Integration
Prefix: sk_old12345...xxx

Ketik: *.confirmdelete Old Integration

Untuk membatalkan, tunggu 30 detik atau ketik command lain.
```

**Command (Step 2 - Konfirmasi):**
```
*.confirmdelete <nama>
```

**Response:**
```
✅ API Key Berhasil Dihapus!

Nama: Old Integration

Key ini tidak bisa digunakan lagi pada API Gateway.
```

---

## 📊 Workflow

### Scenario 1: Setup Baru untuk Web Platform

```
1. Buat API Key
   *.createapikey Web Platform
   
   → Dapatkan full key: sk_abc12345...
   
2. Simpan key di environment atau config web
   
3. Test koneksi
   curl http://localhost:3000/api/whatsapp/status \
     -H "x-api-key: sk_abc12345..."
   
4. Mulai gunakan di aplikasi
   POST http://localhost:3000/api/whatsapp/send-text \
     -H "x-api-key: sk_abc12345..." \
     -d '{"phone":"6281234567890","message":"Test"}'
```

---

### Scenario 2: Rotate Keys untuk Security

```
1. Buat key baru
   *.createapikey Web Platform v2
   
   → Dapatkan key baru
   
2. Update aplikasi dengan key baru
   
3. Nonaktifkan key lama (untuk observe dulu)
   *.deactiveapikey Web Platform
   
4. Setelah yakin tidak ada yang pakai key lama, hapus
   *.deleteapikey Web Platform
   *.confirmdelete Web Platform
```

---

### Scenario 3: Multiple Integrations

```
*.createapikey Web App
*.createapikey Mobile App
*.createapikey Third Party API
*.createapikey Admin Dashboard

→ Masing-masing dengan key sendiri untuk tracking
```

---

## 🐛 Troubleshooting

### Error: "API Key tidak valid atau sudah dinonaktifkan"

**Penyebab:**
- API Key belum dibuat/salah
- API Key sudah dihapus
- API Key sedang nonaktif

**Solusi:**
```bash
# Cek daftar API Key
*.listapikey

# Jika tidak ada, buat baru
*.createapikey <nama>

# Jika ada tapi inactive, aktifkan
*.activeapikey <nama>
```

---

### Error: "API Key Diperlukan"

**Penyebab:**
- Header `x-api-key` tidak include
- Query parameter `?apikey=...` tidak include

**Solusi (PHP):**
```php
$ch = curl_init('http://localhost:3000/api/whatsapp/send-text');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode([...]),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-api-key: sk_your_key_here'  // ✅ Pastikan ini ada
    ]
]);
```

**Solusi (JavaScript):**
```javascript
fetch('http://localhost:3000/api/whatsapp/send-text', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sk_your_key_here'  // ✅ Pastikan ini ada
    },
    body: JSON.stringify({...})
});
```

---

### Lupa Copy Full Key

**Masalah:**
- Full key sudah hilang dan tidak bisa di-lihat lagi

**Solusi:**
1. Hapus API Key lama
   ```
   *.deleteapikey <nama>
   *.confirmdelete <nama>
   ```

2. Buat API Key baru dengan nama sama
   ```
   *.createapikey <nama sama>
   ```

3. Copy full key kali ini dengan teliti!

---

## 📊 API Key Statistics

Setiap API Key mencatat:

- **Request Count** - Total request berhasil menggunakan key ini
- **Last Used** - Kapan terakhir key digunakan
- **Created At** - Waktu pembuatan
- **Status** - Active/Inactive

Gunakan untuk monitoring:
- Detect unusualnya API usage
- Identify unused keys (bisa di-delete)
- Audit trail untuk security

---

## 🔐 Security Best Practices

### DO ✅

- ✅ Simpan key di environment variable, bukan hardcode
- ✅ Gunakan berbeda key untuk setiap integrasi
- ✅ Rotate keys secara berkala (contoh: setiap 3 bulan)
- ✅ Monitor request count untuk detect anomali
- ✅ Delete API Keys yang sudah tidak terpakai

### DON'T ❌

- ❌ Jangan bagikan full key ke orang lain
- ❌ Jangan commit key ke Git/version control
- ❌ Jangan gunakan satu key untuk multiple aplikasi (sulit track)
- ❌ Jangan log/print full key di output
- ❌ Jangan gunakan mudah ditebak seperti `sk_test123`

---

## 📞 Needs Help?

1. Cek command dengan: `*.listapikey`
2. Validasi format nomor dengan API: `/api/whatsapp/validate-phone`
3. Cek bot status dengan: `/api/whatsapp/status`
4. Monitor request count untuk track usage

---

**Created:** 26 Mei 2026  
**Last Updated:** 26 Mei 2026  
**Version:** 1.0.0
