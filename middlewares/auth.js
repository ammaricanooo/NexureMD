import User from '../databases/orm/User.js';
import Group from '../databases/orm/Group.js';
import Setting from '../databases/orm/Setting.js';

import config from '../config.js';
import { resolveLidToJid } from '../libs/lid-resolver.js';
import { getGroupMetadata, setGroupMetadata } from '../libs/groupCache.js';

let cachedSetting = null;
let lastCacheUpdate = 0;
let settingFetchPromise = null; // Mencegah burst DB query saat cache expired
const CACHE_TTL = 30000; // 30 detik

const getCachedSetting = async () => {
    const now = Date.now();
    if (cachedSetting && (now - lastCacheUpdate) <= CACHE_TTL) {
        return cachedSetting;
    }
    // Jika sudah ada promise yang sedang berjalan, tunggu hasilnya (jangan buat request baru)
    if (!settingFetchPromise) {
        settingFetchPromise = Setting.findOrCreate({
            where: { id: 1 },
            defaults: { is_public: true, is_register: true, is_gconly: false, is_agent: false }
        }).then(([setting]) => {
            cachedSetting = setting;
            lastCacheUpdate = Date.now();
            settingFetchPromise = null;
            return setting;
        }).catch(err => {
            settingFetchPromise = null;
            throw err;
        });
    }
    return settingFetchPromise;
};

export const processAuth = async (sock, msgData) => {
    const setting = await getCachedSetting();

    // Default status admin
    msgData.isAdmin = false;
    msgData.isBotAdmin = false;

    // Jangan simpan grup atau status broadcast ke tabel User
    if (msgData.senderJid.endsWith('@g.us') || msgData.senderJid === 'status@broadcast') {
        return {
            user: { is_registered: false, is_premium: false, is_banned: false, limit: 0, isOwner: false },
            group: null,
            setting
        };
    }

    const [user] = await User.findOrCreate({
        where: { jid: msgData.senderJid },
        defaults: {
            name: msgData.pushName,
            is_registered: false
        }
    });

    if (user.name !== msgData.pushName && msgData.pushName) {
        await user.update({ name: msgData.pushName });
    }

    const ownerJid = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
    const botJid = sock.user?.id?.split(':')[0].split('@')[0] + '@s.whatsapp.net';
    
    // Bandingkan JID yang sudah di-resolve (senderJid)
    const isOwner = (msgData.senderJid.split(':')[0].split('@')[0] === ownerJid.split(':')[0].split('@')[0]) || 
                    (msgData.senderJid.split(':')[0].split('@')[0] === botJid.split(':')[0].split('@')[0]) || 
                    msgData.fromMe;

    user.isOwner = isOwner;
    
    let group = null;
    if (msgData.isGroup) {
        let metadata = getGroupMetadata(msgData.remoteJid);

        if (!metadata || !Array.isArray(metadata.participants) || metadata.participants.length === 0) {
            // Cache miss atau data kosong: coba ambil dari WhatsApp
            let dbGroup = await Group.findOne({ where: { jid: msgData.remoteJid } });
            try {
                // Beri timeout 3.5 detik untuk fetch WhatsApp
                const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), ms));
                metadata = await Promise.race([
                    sock.groupMetadata(msgData.remoteJid),
                    timeout(3500)
                ]);

                if (metadata && Array.isArray(metadata.participants) && metadata.participants.length > 0) {
                    setGroupMetadata(msgData.remoteJid, metadata);
                }
            } catch (err) {
                // Jika gagal fetch metadata (timeout/error), gunakan data dari DB atau dummy
                metadata = {
                    id: msgData.remoteJid,
                    subject: dbGroup?.name || 'Unknown Group',
                    participants: []
                };
            }
        }

        const [groupData, created] = await Group.findOrCreate({
            where: { jid: msgData.remoteJid },
            defaults: { name: metadata.subject }
        });

        group = groupData;

        if (!created && group.name !== metadata.subject && metadata.subject !== 'Unknown Group') {
            await group.update({ name: metadata.subject });
        }

        // Fungsi pembantu untuk normalisasi JID ke format nomor murni (hanya digit angka)
        const jidToNum = (jid) => {
            if (!jid) return '';
            return jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        };

        const normalizePhone = (num) => {
            if (!num) return '';
            let clean = num.replace(/[^0-9]/g, '');
            if (clean.startsWith('0')) clean = '62' + clean.slice(1);
            return clean;
        };

        // Kumpulkan semua identifier bot (nomor telepon, nomor LID, dan nomor dari config)
        const botNum = normalizePhone(jidToNum(sock?.user?.id));
        const botLidNum = jidToNum(sock?.user?.lid);
        const configBotNum = normalizePhone(config.BOT_NUMBER);
        const botIdentifiers = new Set([botNum, botLidNum, configBotNum].filter(Boolean));

        const isBotParticipant = (p) => {
            if (!p) return false;
            const pIdNum = jidToNum(p.id);
            const pLidNum = jidToNum(p.lid);
            const pPhoneNum = normalizePhone(pIdNum);
            const pResolvedNum = normalizePhone(jidToNum(resolveLidToJid(p.id)));
            const pLidResolvedNum = normalizePhone(jidToNum(resolveLidToJid(p.lid)));
            return (
                botIdentifiers.has(pIdNum) ||
                botIdentifiers.has(pLidNum) ||
                botIdentifiers.has(pPhoneNum) ||
                botIdentifiers.has(pResolvedNum) ||
                botIdentifiers.has(pLidResolvedNum)
            );
        };

        // Kumpulkan identifier pengirim pesan
        const senderNum = normalizePhone(jidToNum(msgData.senderJid));
        const rawSenderNum = normalizePhone(jidToNum(msgData.rawSenderJid || msgData.participant));
        const senderRawId = jidToNum(msgData.senderJid);
        const senderRawParticipant = jidToNum(msgData.rawSenderJid || msgData.participant);
        const senderIdentifiers = new Set([senderNum, rawSenderNum, senderRawId, senderRawParticipant].filter(Boolean));

        const isSenderParticipant = (p) => {
            if (!p) return false;
            const pIdNum = jidToNum(p.id);
            const pLidNum = jidToNum(p.lid);
            const pPhoneNum = normalizePhone(pIdNum);
            const pResolvedNum = normalizePhone(jidToNum(resolveLidToJid(p.id)));
            const pLidResolvedNum = normalizePhone(jidToNum(resolveLidToJid(p.lid)));
            return (
                senderIdentifiers.has(pIdNum) ||
                senderIdentifiers.has(pLidNum) ||
                senderIdentifiers.has(pPhoneNum) ||
                senderIdentifiers.has(pResolvedNum) ||
                senderIdentifiers.has(pLidResolvedNum) ||
                p.id === msgData.senderJid ||
                p.lid === msgData.senderJid ||
                (msgData.rawSenderJid && (p.id === msgData.rawSenderJid || p.lid === msgData.rawSenderJid))
            );
        };

        let botParticipant = metadata?.participants?.find(isBotParticipant);
        let isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

        let senderParticipant = metadata?.participants?.find(isSenderParticipant);
        let isAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

        // Jika bot belum terdeteksi admin ATAU pengirim bukan admin dan bukan owner,
        // ada kemungkinan metadata grup di cache sudah basi (stale) atau kosong.
        // Lakukan fetch metadata segar langsung dari WhatsApp agar akurat 100%!
        if (!isBotAdmin || (!isAdmin && !user.isOwner)) {
            try {
                const freshMetadata = await sock.groupMetadata(msgData.remoteJid);
                if (freshMetadata && Array.isArray(freshMetadata.participants) && freshMetadata.participants.length > 0) {
                    metadata = freshMetadata;
                    setGroupMetadata(msgData.remoteJid, freshMetadata);

                    botParticipant = metadata.participants.find(isBotParticipant);
                    isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

                    senderParticipant = metadata.participants.find(isSenderParticipant);
                    isAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
                }
            } catch (err) {
                // Abaikan jika fetch live gagal karena timeout/jaringan
            }
        }

        msgData.isBotAdmin = isBotAdmin;
        msgData.isAdmin = isAdmin;
    }

    return { user, group, setting };
};
