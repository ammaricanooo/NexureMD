import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { trayekAngkot, refreshAngkotData } from '../../databases/angkot-bogor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const customPath = path.join(__dirname, '..', '..', 'databases', 'angkot-bogor-custom.json');

function ensureCustomFile() {
    const defaultData = {
        trayekAngkot: [],
        aliasLokasi: {},
        deletedTrayekCodes: []
    };

    if (!fs.existsSync(customPath)) {
        fs.writeFileSync(customPath, JSON.stringify(defaultData, null, 2), 'utf-8');
        return defaultData;
    }

    return loadCustomData();
}

function loadCustomData() {
    try {
        const raw = fs.readFileSync(customPath, 'utf-8');
        const data = JSON.parse(raw);
        return {
            trayekAngkot: Array.isArray(data.trayekAngkot) ? data.trayekAngkot : [],
            aliasLokasi: typeof data.aliasLokasi === 'object' && data.aliasLokasi !== null ? data.aliasLokasi : {},
            deletedTrayekCodes: Array.isArray(data.deletedTrayekCodes) ? data.deletedTrayekCodes : []
        };
    } catch (err) {
        return ensureCustomFile();
    }
}

function saveCustomData(data) {
    fs.writeFileSync(customPath, JSON.stringify(data, null, 2), 'utf-8');
}

function normalizeKode(kode) {
    return kode?.toString?.().trim().toUpperCase();
}

function parseStops(value) {
    return value
        .split(/;|\n|\\|,/) 
        .map(stop => stop.trim())
        .filter(Boolean);
}

function formatRoute(trayek) {
    return `*${trayek.kode}* - ${trayek.nama}\n• Warna: ${trayek.warna || 'N/A'}\n• Tarif: Rp ${Number(trayek.tarif || 0).toLocaleString('id-ID')}\n• Waktu: ${Number(trayek.waktu_menit || 0)} menit\n• Rute: ${trayek.rute.join(' ➜ ')}${trayek.keterangan ? `\n• Info: ${trayek.keterangan}` : ''}`;
}

function findCustomIndex(data, kode) {
    return data.trayekAngkot.findIndex(item => normalizeKode(item.kode) === normalizeKode(kode));
}

function findRoute(data, kode) {
    return data.find(item => normalizeKode(item.kode) === normalizeKode(kode));
}

function sendHelp(sock, remoteJid, quoted) {
    return sock.sendMessage(remoteJid, {
        text: `🛠️ *Angkot Admin Command Help* 🛠️

` +
              `*.angkotadmin add <kode> | <nama> | <warna> | <tarif> | <waktu_menit> | <jarak_km> | <rute stop1; stop2; ...> | <keterangan>*\n` +
              `*.angkotadmin update <kode> | <field> | <nilai>*\n` +
              `*.angkotadmin delete <kode>*\n` +
              `*.angkotadmin addstop <kode> | <stop> | <posisi>*\n` +
              `*.angkotadmin delstop <kode> | <stop>*\n` +
              `*.angkotadmin alias <alias> | <tujuan>*\n` +
              `*.angkotadmin list [kode]*\n
` +
              `*Fields update:* nama, warna, tarif, waktu_menit, jarak_km, keterangan, rute`.trim()
    }, { quoted });
}

export default {
    command: ['angkotadmin', 'angkotmanage', 'angkotcrud'],
    category: 'owner',
    isOwner: true,
    description: 'Kelola data angkot Bogor: add, update, delete, tambah/hapus stop, alias',
    async execute(sock, m, msgData) {
        const args = msgData.args || [];
        const action = args[0]?.toLowerCase();
        const payload = args.slice(1).join(' ').trim();

        if (!action || action === 'help') {
            return sendHelp(sock, msgData.remoteJid, m);
        }

        const customData = ensureCustomFile();
        const parts = payload.split('|').map(part => part.trim()).filter(Boolean);
        const code = normalizeKode(parts[0]);

        try {
            switch (action) {
                case 'list': {
                    if (!parts[0]) {
                        const list = trayekAngkot.slice(0, 50).map(trayek => `• ${trayek.kode} — ${trayek.nama}`).join('\n');
                        return sock.sendMessage(msgData.remoteJid, {
                            text: `📋 *Daftar 50 Rute Angkot Teratas*\n\n${list}\n\nGunakan *.angkotadmin list <kode>* untuk detail.`
                        }, { quoted: m });
                    }

                    const route = findRoute(trayekAngkot, code);
                    if (!route) {
                        return sock.sendMessage(msgData.remoteJid, { text: `❌ Rute dengan kode ${parts[0]} tidak ditemukan.` }, { quoted: m });
                    }

                    return sock.sendMessage(msgData.remoteJid, { text: formatRoute(route) }, { quoted: m });
                }
                case 'add': {
                    if (parts.length < 7) {
                        return sock.sendMessage(msgData.remoteJid, { text: '❌ Gunakan: .angkotadmin add <kode> | <nama> | <warna> | <tarif> | <waktu_menit> | <jarak_km> | <rute stop1; stop2; ...> | <keterangan>' }, { quoted: m });
                    }

                    const [kode, nama, warna, tarifText, waktuText, jarakText, ruteText, keterangan = ''] = parts;
                    const tarif = Number(tarifText || 0);
                    const waktu_menit = Number(waktuText || 0);
                    const jarak_km = Number(jarakText || 0);
                    const rute = parseStops(ruteText);
                    if (!kode || !nama || rute.length < 2) {
                        return sock.sendMessage(msgData.remoteJid, { text: '❌ Pastikan kode, nama, dan minimal 2 stop rute terisi.' }, { quoted: m });
                    }

                    const entry = {
                        kode: normalizeKode(kode),
                        nama,
                        warna: warna || 'N/A',
                        tarif,
                        waktu_menit,
                        jarak_km,
                        rute,
                        keterangan
                    };

                    const existingIndex = findCustomIndex(customData, entry.kode);
                    if (existingIndex !== -1) {
                        customData.trayekAngkot[existingIndex] = entry;
                    } else {
                        customData.trayekAngkot.push(entry);
                    }

                    customData.deletedTrayekCodes = (customData.deletedTrayekCodes || []).filter(code => code.toUpperCase() !== entry.kode);
                    saveCustomData(customData);
                    refreshAngkotData();

                    return sock.sendMessage(msgData.remoteJid, { text: `✅ Rute angkot *${entry.kode}* berhasil ditambahkan / diubah.` }, { quoted: m });
                }
                case 'update': {
                    if (parts.length < 3) {
                        return sock.sendMessage(msgData.remoteJid, { text: '❌ Gunakan: .angkotadmin update <kode> | <field> | <nilai>' }, { quoted: m });
                    }
                    const [kode, field, value] = parts;
                    const routeCode = normalizeKode(kode);
                    const existingRoute = findRoute(trayekAngkot, routeCode);
                    if (!existingRoute) {
                        return sock.sendMessage(msgData.remoteJid, { text: `❌ Rute ${kode} tidak ditemukan.` }, { quoted: m });
                    }

                    const customIndex = findCustomIndex(customData, routeCode);
                    const routeEntry = customIndex !== -1 ? customData.trayekAngkot[customIndex] : { ...existingRoute };
                    const targetField = field.toLowerCase();

                    if (targetField === 'rute') {
                        routeEntry.rute = parseStops(value);
                    } else if (targetField === 'tarif') {
                        routeEntry.tarif = Number(value || 0);
                    } else if (targetField === 'waktu_menit') {
                        routeEntry.waktu_menit = Number(value || 0);
                    } else if (targetField === 'jarak_km') {
                        routeEntry.jarak_km = Number(value || 0);
                    } else if (targetField === 'nama' || targetField === 'warna' || targetField === 'keterangan') {
                        routeEntry[targetField] = value;
                    } else {
                        return sock.sendMessage(msgData.remoteJid, { text: `❌ Field tidak dikenali: ${field}. Gunakan nama, warna, tarif, waktu_menit, jarak_km, keterangan, atau rute.` }, { quoted: m });
                    }

                    if (customIndex === -1) {
                        customData.trayekAngkot.push(routeEntry);
                    } else {
                        customData.trayekAngkot[customIndex] = routeEntry;
                    }
                    customData.deletedTrayekCodes = (customData.deletedTrayekCodes || []).filter(code => code.toUpperCase() !== routeCode);
                    saveCustomData(customData);
                    refreshAngkotData();

                    return sock.sendMessage(msgData.remoteJid, { text: `✅ Rute ${routeCode} berhasil diperbarui.` }, { quoted: m });
                }
                case 'delete': {
                    if (!parts[0]) {
                        return sock.sendMessage(msgData.remoteJid, { text: '❌ Gunakan: .angkotadmin delete <kode>' }, { quoted: m });
                    }
                    if (!findRoute(trayekAngkot, code)) {
                        return sock.sendMessage(msgData.remoteJid, { text: `❌ Rute ${parts[0]} tidak ditemukan.` }, { quoted: m });
                    }
                    customData.trayekAngkot = customData.trayekAngkot.filter(item => normalizeKode(item.kode) !== code);
                    customData.deletedTrayekCodes = Array.from(new Set([...(customData.deletedTrayekCodes || []).map(c => normalizeKode(c)), code]));
                    saveCustomData(customData);
                    refreshAngkotData();

                    return sock.sendMessage(msgData.remoteJid, { text: `✅ Rute ${parts[0]} berhasil dihapus dari hasil pencarian.` }, { quoted: m });
                }
                case 'addstop': {
                    if (parts.length < 2) {
                        return sock.sendMessage(msgData.remoteJid, { text: '❌ Gunakan: .angkotadmin addstop <kode> | <stop> | <posisi>' }, { quoted: m });
                    }
                    const [kode, stop, positionText] = parts;
                    const routeCode = normalizeKode(kode);
                    const route = findRoute(trayekAngkot, routeCode);
                    if (!route) {
                        return sock.sendMessage(msgData.remoteJid, { text: `❌ Rute ${kode} tidak ditemukan.` }, { quoted: m });
                    }
                    const stopName = stop.trim();
                    if (!stopName) {
                        return sock.sendMessage(msgData.remoteJid, { text: '❌ Nama stop tidak boleh kosong.' }, { quoted: m });
                    }

                    const customIndex = findCustomIndex(customData, routeCode);
                    const routeEntry = customIndex !== -1 ? customData.trayekAngkot[customIndex] : { ...route };
                    if (customIndex === -1) customData.trayekAngkot.push(routeEntry);

                    const position = Number(positionText);
                    if (!Number.isNaN(position) && position >= 1 && position <= routeEntry.rute.length + 1) {
                        routeEntry.rute.splice(position - 1, 0, stopName);
                    } else {
                        routeEntry.rute.push(stopName);
                    }

                    saveCustomData(customData);
                    refreshAngkotData();
                    return sock.sendMessage(msgData.remoteJid, { text: `✅ Stop *${stopName}* berhasil ditambahkan ke ${routeCode}.` }, { quoted: m });
                }
                case 'delstop': {
                    if (parts.length < 2) {
                        return sock.sendMessage(msgData.remoteJid, { text: '❌ Gunakan: .angkotadmin delstop <kode> | <stop>' }, { quoted: m });
                    }
                    const [kodeDel, stopDel] = parts;
                    const routeCodeDel = normalizeKode(kodeDel);
                    const routeDel = findRoute(trayekAngkot, routeCodeDel);
                    if (!routeDel) {
                        return sock.sendMessage(msgData.remoteJid, { text: `❌ Rute ${kodeDel} tidak ditemukan.` }, { quoted: m });
                    }

                    const customIndexDel = findCustomIndex(customData, routeCodeDel);
                    const routeEntryDel = customIndexDel !== -1 ? customData.trayekAngkot[customIndexDel] : { ...routeDel };
                    if (customIndexDel === -1) customData.trayekAngkot.push(routeEntryDel);

                    const remaining = routeEntryDel.rute.filter(stop => stop.toLowerCase() !== stopDel.toLowerCase());
                    if (remaining.length === routeEntryDel.rute.length) {
                        return sock.sendMessage(msgData.remoteJid, { text: `❌ Stop ${stopDel} tidak ditemukan pada rute ${kodeDel}.` }, { quoted: m });
                    }
                    routeEntryDel.rute = remaining;
                    saveCustomData(customData);
                    refreshAngkotData();

                    return sock.sendMessage(msgData.remoteJid, { text: `✅ Stop *${stopDel}* berhasil dihapus dari ${kodeDel}.` }, { quoted: m });
                }
                case 'alias': {
                    if (parts.length < 2) {
                        return sock.sendMessage(msgData.remoteJid, { text: '❌ Gunakan: .angkotadmin alias <alias> | <tujuan>' }, { quoted: m });
                    }
                    const [alias, target] = parts;
                    if (!alias || !target) {
                        return sock.sendMessage(msgData.remoteJid, { text: '❌ Alias dan tujuan harus terisi.' }, { quoted: m });
                    }
                    customData.aliasLokasi[alias.toLowerCase()] = target;
                    saveCustomData(customData);
                    refreshAngkotData();
                    return sock.sendMessage(msgData.remoteJid, { text: `✅ Alias *${alias}* sekarang mengarah ke *${target}*.` }, { quoted: m });
                }
                default:
                    return sendHelp(sock, msgData.remoteJid, m);
            }
        } catch (err) {
            console.error('Angkot Admin Error:', err);
            return sock.sendMessage(msgData.remoteJid, { text: `❌ Terjadi kesalahan: ${err.message}` }, { quoted: m });
        }
    }
};
