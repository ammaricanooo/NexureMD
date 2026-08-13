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
        try {
            fs.writeFileSync(customPath, JSON.stringify(defaultData, null, 2), 'utf-8');
        } catch (e) {
            console.error('Failed to create custom angkot file:', e);
        }
        return defaultData;
    }

    return loadCustomData();
}

function loadCustomData() {
    const defaultData = {
        trayekAngkot: [],
        aliasLokasi: {},
        deletedTrayekCodes: []
    };
    try {
        if (!fs.existsSync(customPath)) {
            fs.writeFileSync(customPath, JSON.stringify(defaultData, null, 2), 'utf-8');
            return defaultData;
        }
        const raw = fs.readFileSync(customPath, 'utf-8');
        const data = JSON.parse(raw);
        return {
            trayekAngkot: Array.isArray(data.trayekAngkot) ? data.trayekAngkot : [],
            aliasLokasi: typeof data.aliasLokasi === 'object' && data.aliasLokasi !== null ? data.aliasLokasi : {},
            deletedTrayekCodes: Array.isArray(data.deletedTrayekCodes) ? data.deletedTrayekCodes : []
        };
    } catch (err) {
        console.error('Failed to read/parse custom angkot data:', err);
        return defaultData;
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
    return (
        `🚌 *DETAIL RUTE ANGKOT ${trayek.kode}* 🚌\n\n` +
        `• *Nama Rute :* ${trayek.nama}\n` +
        `• *Warna     :* ${trayek.warna || 'N/A'}\n` +
        `• *Tarif     :* Rp ${Number(trayek.tarif || 0).toLocaleString('id-ID')}\n` +
        `• *Est. Waktu:* ${Number(trayek.waktu_menit || 0)} menit\n` +
        `• *Jarak     :* ${Number(trayek.jarak_km || 0)} km\n` +
        `• *Rute Stop :*\n  ${trayek.rute.join(' ➜ ')}` +
        `${trayek.keterangan ? `\n\n📝 *Info Tambahan:* ${trayek.keterangan}` : ''}`
    );
}

function findCustomIndex(data, kode) {
    return data.trayekAngkot.findIndex(item => normalizeKode(item.kode) === normalizeKode(kode));
}

function findRoute(data, kode) {
    return data.find(item => normalizeKode(item.kode) === normalizeKode(kode));
}

function sendHelp(msgData) {
    return msgData.reply(
        `🛠️ *ANGKOT ADMIN MANAGEMENT* 🛠️\n\n` +
        `Halo Owner ganteng/cantik~! Berikut daftar perintah kelola rute angkot Bogor:\n\n` +
        `• *.angkotadmin add <kode> | <nama> | <warna> | <tarif> | <waktu_menit> | <jarak_km> | <rute stop1; stop2; ...> | <keterangan>*\n` +
        `• *.angkotadmin update <kode> | <field> | <nilai>*\n` +
        `• *.angkotadmin delete <kode>*\n` +
        `• *.angkotadmin addstop <kode> | <stop> | <posisi>*\n` +
        `• *.angkotadmin delstop <kode> | <stop>*\n` +
        `• *.angkotadmin alias <alias> | <tujuan>*\n` +
        `• *.angkotadmin list [kode]*\n\n` +
        `*Pilihan field update:* \`nama\`, \`warna\`, \`tarif\`, \`waktu_menit\`, \`jarak_km\`, \`keterangan\`, \`rute\`\n\n` +
        `Semangat mengelola data angkotnya yaa Bossku! (˶˃ ᵕ ˂˶) ✨`
    );
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
            return sendHelp(msgData);
        }

        const customData = ensureCustomFile();
        const parts = payload.split('|').map(part => part.trim()).filter(Boolean);
        const code = normalizeKode(parts[0]);

        try {
            switch (action) {
                case 'list': {
                    if (!parts[0]) {
                        const list = trayekAngkot.slice(0, 50).map(trayek => `• *${trayek.kode}* — ${trayek.nama}`).join('\n');
                        return msgData.reply(
                            `📋 *DAFTAR RUTE ANGKOT BOGOR (Top 50)*\n\n${list}\n\n` +
                            `*Gunakan:* \`.angkotadmin list <kode>\` untuk detail rute yaa kak! (๑>ᴗ<๑)`
                        );
                    }

                    const route = findRoute(trayekAngkot, code);
                    if (!route) {
                        return msgData.reply(`Aduuh kak, rute angkot dengan kode *${parts[0]}* tidak ditemukan.. (╥﹏╥)`);
                    }

                    return msgData.reply(formatRoute(route));
                }
                case 'add': {
                    if (parts.length < 7) {
                        return msgData.reply(
                            `Uwaaa! Format penambahan rute salah kak.. (｡T ω T｡)\n\n` +
                            `*Gunakan:* \`.angkotadmin add <kode> | <nama> | <warna> | <tarif> | <waktu_menit> | <jarak_km> | <rute stop1; stop2; ...> | <keterangan>\``
                        );
                    }

                    const [kode, nama, warna, tarifText, waktuText, jarakText, ruteText, keterangan = ''] = parts;
                    const tarif = Number(tarifText || 0);
                    const waktu_menit = Number(waktuText || 0);
                    const jarak_km = Number(jarakText || 0);
                    const rute = parseStops(ruteText);
                    if (!kode || !nama || rute.length < 2) {
                        return msgData.reply(`Aduuh kak, pastikan kode, nama, dan minimal 2 titik stop rute terisi yaa~ (╥﹏╥)`);
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

                    customData.deletedTrayekCodes = (customData.deletedTrayekCodes || []).filter(c => c.toUpperCase() !== entry.kode);
                    saveCustomData(customData);
                    refreshAngkotData();

                    await msgData.react('✅');
                    return msgData.reply(`Horeee! Rute angkot *${entry.kode}* berhasil ditambahkan / diperbarui~ (˶˃ ᵕ ˂˶) ✨`);
                }
                case 'update': {
                    if (parts.length < 3) {
                        return msgData.reply(
                            `Uwaaa! Format update rute kurang lengkap kak.. (｡T ω T｡)\n\n` +
                            `*Gunakan:* \`.angkotadmin update <kode> | <field> | <nilai>\``
                        );
                    }
                    const [kode, field, value] = parts;
                    const routeCode = normalizeKode(kode);
                    const existingRoute = findRoute(trayekAngkot, routeCode);
                    if (!existingRoute) {
                        return msgData.reply(`Aduuh kak, rute *${kode}* tidak ditemukan di database.. (╥﹏╥)`);
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
                        return msgData.reply(
                            `Field *${field}* tidak dikenali kak! Gunakan: \`nama\`, \`warna\`, \`tarif\`, \`waktu_menit\`, \`jarak_km\`, \`keterangan\`, atau \`rute\` yaa~ (๑>ᴗ<๑)`
                        );
                    }

                    if (customIndex === -1) {
                        customData.trayekAngkot.push(routeEntry);
                    } else {
                        customData.trayekAngkot[customIndex] = routeEntry;
                    }
                    customData.deletedTrayekCodes = (customData.deletedTrayekCodes || []).filter(c => c.toUpperCase() !== routeCode);
                    saveCustomData(customData);
                    refreshAngkotData();

                    await msgData.react('✅');
                    return msgData.reply(`Yeay! Rute *${routeCode}* berhasil diperbarui yaa kak~ (˶˃ ᵕ ˂˶) ✨`);
                }
                case 'delete': {
                    if (!parts[0]) {
                        return msgData.reply(
                            `Uwaaa! Format hapus rute salah kak.. (｡T ω T｡)\n\n` +
                            `*Gunakan:* \`.angkotadmin delete <kode>\``
                        );
                    }
                    if (!findRoute(trayekAngkot, code)) {
                        return msgData.reply(`Aduuh kak, rute *${parts[0]}* tidak ditemukan.. (╥﹏╥)`);
                    }
                    customData.trayekAngkot = customData.trayekAngkot.filter(item => normalizeKode(item.kode) !== code);
                    customData.deletedTrayekCodes = Array.from(new Set([...(customData.deletedTrayekCodes || []).map(c => normalizeKode(c)), code]));
                    saveCustomData(customData);
                    refreshAngkotData();

                    await msgData.react('✅');
                    return msgData.reply(`Berhasil! Rute *${parts[0]}* telah dihapus dari sistem pencarian yaa kak~ (˶˃ ᵕ ˂˶)`);
                }
                case 'addstop': {
                    if (parts.length < 2) {
                        return msgData.reply(
                            `Uwaaa! Format tambah stop kurang lengkap kak.. (｡T ω T｡)\n\n` +
                            `*Gunakan:* \`.angkotadmin addstop <kode> | <stop> | <posisi>\``
                        );
                    }
                    const [kode, stop, positionText] = parts;
                    const routeCode = normalizeKode(kode);
                    const route = findRoute(trayekAngkot, routeCode);
                    if (!route) {
                        return msgData.reply(`Aduuh kak, rute *${kode}* tidak ditemukan.. (╥﹏╥)`);
                    }
                    const stopName = stop.trim();
                    if (!stopName) {
                        return msgData.reply(`Aduuh kak, nama titik stop tidak boleh kosong yaa~ (╥﹏╥)`);
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

                    await msgData.react('✅');
                    return msgData.reply(`Yeay! Stop *${stopName}* berhasil ditambahkan ke rute *${routeCode}*~ (˶˃ ᵕ ˂˶)`);
                }
                case 'delstop': {
                    if (parts.length < 2) {
                        return msgData.reply(
                            `Uwaaa! Format hapus stop kurang lengkap kak.. (｡T ω T｡)\n\n` +
                            `*Gunakan:* \`.angkotadmin delstop <kode> | <stop>\``
                        );
                    }
                    const [kodeDel, stopDel] = parts;
                    const routeCodeDel = normalizeKode(kodeDel);
                    const routeDel = findRoute(trayekAngkot, routeCodeDel);
                    if (!routeDel) {
                        return msgData.reply(`Aduuh kak, rute *${kodeDel}* tidak ditemukan.. (╥﹏╥)`);
                    }

                    const customIndexDel = findCustomIndex(customData, routeCodeDel);
                    const routeEntryDel = customIndexDel !== -1 ? customData.trayekAngkot[customIndexDel] : { ...routeDel };
                    if (customIndexDel === -1) customData.trayekAngkot.push(routeEntryDel);

                    const remaining = routeEntryDel.rute.filter(stop => stop.toLowerCase() !== stopDel.toLowerCase());
                    if (remaining.length === routeEntryDel.rute.length) {
                        return msgData.reply(`Aduuh kak, titik stop *${stopDel}* tidak ditemukan pada rute *${kodeDel}*.. (╥﹏╥)`);
                    }
                    routeEntryDel.rute = remaining;
                    saveCustomData(customData);
                    refreshAngkotData();

                    await msgData.react('✅');
                    return msgData.reply(`Berhasil! Stop *${stopDel}* telah dihapus dari rute *${kodeDel}* yaa kak~ (˶˃ ᵕ ˂˶)`);
                }
                case 'alias': {
                    if (parts.length < 2) {
                        return msgData.reply(
                            `Uwaaa! Format alias kurang lengkap kak.. (｡T ω T｡)\n\n` +
                            `*Gunakan:* \`.angkotadmin alias <alias> | <tujuan>\``
                        );
                    }
                    const [alias, target] = parts;
                    if (!alias || !target) {
                        return msgData.reply(`Aduuh kak, alias dan tujuan harus terisi yaa~ (╥﹏╥)`);
                    }
                    customData.aliasLokasi[alias.toLowerCase()] = target;
                    saveCustomData(customData);
                    refreshAngkotData();

                    await msgData.react('✅');
                    return msgData.reply(`Horeee! Alias *${alias}* sekarang resmi terhubung ke *${target}* yaa kak~ (˶˃ ᵕ ˂˶) ✨`);
                }
                default:
                    return sendHelp(msgData);
            }
        } catch (err) {
            console.error('Angkot Admin Error:', err);
            await msgData.react('❌');
            return msgData.reply(`Uwaaa gawat! Terjadi kesalahan saat memproses perintah admin angkot: ${err.message}.. (╥﹏╥)`);
        }
    }
};

