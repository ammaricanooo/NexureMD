import ApiKey, { generateApiKey, hashApiKey } from '../../databases/orm/ApiKey.js';

export default {
    command: ['createapikey'],
    category: 'owner',
    isOwner: true,
    description: '🔑 Buat API Key baru untuk gateway WhatsApp',
    async execute(sock, m, msgData) {
        const { args, senderJid, remoteJid } = msgData;

        if (args.length === 0) {
            return sock.sendMessage(remoteJid, {
                text: `
🔑 *Buat API Key Baru*

Gunakan: *.createapikey <nama>

Contoh:
*.createapikey Web Platform
*.createapikey Mobile App
*.createapikey Third Party Integration

Nama adalah identitas API Key untuk kemudahan tracking.
`.trim()
            });
        }

        try {
            const keyName = args.join(' ');

            // Validasi nama
            if (keyName.length < 3 || keyName.length > 255) {
                return sock.sendMessage(remoteJid, { text: '❌ Nama API Key minimal 3 dan maksimal 255 karakter!' });
            }

            // Generate key baru
            const { key, prefix } = generateApiKey();
            const hashedKey = hashApiKey(key);

            // Simpan ke database
            await ApiKey.create({
                name: keyName,
                key: hashedKey,
                key_prefix: prefix,
                owner_number: senderJid,
                description: `Created on ${new Date().toLocaleString()}`,
                is_active: true
            });

            const response = `
✅ *API Key Berhasil Dibuat!* 

*Nama:* ${keyName}
*Prefix:* \`${prefix}...xxx\`

🔐 *Full Key (simpan dengan aman):*
\`\`\`
${key}
\`\`\`

⚠️ *PENTING:*
- Simpan key ini di tempat yang aman!
- Key hanya ditampilkan 1x saja
- Jangan bagikan key ke orang lain
- Untuk lihat semua key: *.listapikey

*Gunakan pada API Gateway:*
Header: x-api-key: ${key}

Atau query parameter:
?apikey=${key}
`.trim();

            return sock.sendMessage(remoteJid, { text: response });
        } catch (error) {
            console.error('Create API Key Error:', error);
            return sock.sendMessage(remoteJid, { text: `❌ Error: ${error.message}` });
        }
    }
};

