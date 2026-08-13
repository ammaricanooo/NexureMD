import Product from '../../databases/orm/Product.js';

const formatCurrency = (value) => {
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    return `Rp ${number.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
};

export default {
    command: ['product'],
    category: 'store',
    isRegistered: true,
    isOwner: true,
    description: 'Kelola produk toko: add, update, delete, info, dan list.',
    async execute(sock, m, msgData) {
        const { args } = msgData;
        const subcommand = args[0]?.toLowerCase();

        const usage = `🛠️ *PANDUAN KELOLA PRODUK TOKO* 🛠️\n\n` +
            `• *.product add <nama>|<harga>|<stok>|<deskripsi>*\n` +
            `• *.product update <id>|<nama>|<harga>|<stok>|<deskripsi>|<aktif>*\n` +
            `• *.product delete <id>*\n` +
            `• *.product info <id>*\n` +
            `• *.product list*\n\n` +
            `*Contoh:* \`.product add Kaos Keren|75000|10|Kaos distro premium\``;

        if (!subcommand || subcommand === 'help') {
            return msgData.reply(usage);
        }

        try {
            if (subcommand === 'add') {
                const payload = args.slice(1).join(' ');
                if (!payload) return msgData.reply(`Uwaaa! Format penambahan produk tidak lengkap kak.. (｡T ω T｡)\n\n${usage}`);

                const [name, priceText, stockText, description = ''] = payload.split('|').map(p => p.trim());
                if (!name || !priceText || !stockText) return msgData.reply(`Aduuh kak, nama, harga, dan stok wajib diisi yaa~ (╥﹏╥)\n\n${usage}`);

                const price = parseFloat(priceText.replace(/,/g, '.'));
                const stock = parseInt(stockText, 10);
                if (Number.isNaN(price) || price < 0) return msgData.reply('Aduuh kak, harga tidak valid! Gunakan angka seperti 75000.');
                if (Number.isNaN(stock) || stock < 0) return msgData.reply('Aduuh kak, stok tidak valid! Gunakan angka bulat minimal 0.');

                const product = await Product.create({
                    name,
                    price,
                    stock,
                    description,
                    created_by: msgData.senderJid
                });

                await msgData.react('✅');
                return msgData.reply(`Horeee! Produk berhasil ditambahkan kak~ (˶˃ ᵕ ˂˶) ✨\n\n🆔 *ID:* \`${product.id}\`\n📦 *Nama:* ${product.name}\n💰 *Harga:* ${formatCurrency(product.price)}\n📊 *Stok:* ${product.stock}`);
            }

            if (subcommand === 'update') {
                const payload = args.slice(1).join(' ');
                if (!payload) return msgData.reply(`Uwaaa! Format update produk tidak lengkap kak.. (｡T ω T｡)\n\n${usage}`);

                const [idText, name, priceText, stockText, description = '', activeText = ''] = payload.split('|').map(p => p.trim());
                const id = parseInt(idText, 10);
                if (Number.isNaN(id)) return msgData.reply('ID produk tidak valid kak.');

                const product = await Product.findByPk(id);
                if (!product) return msgData.reply(`Aduuh kak, produk dengan ID *${id}* tidak ditemukan.. (╥﹏╥)`);

                const updates = {};
                if (name) updates.name = name;
                if (priceText) {
                    const price = parseFloat(priceText.replace(/,/g, '.'));
                    if (Number.isNaN(price) || price < 0) return msgData.reply('Harga tidak valid kak.');
                    updates.price = price;
                }
                if (stockText) {
                    const stock = parseInt(stockText, 10);
                    if (Number.isNaN(stock) || stock < 0) return msgData.reply('Stok tidak valid kak.');
                    updates.stock = stock;
                }
                updates.description = description;
                if (activeText.toLowerCase() === 'true' || activeText.toLowerCase() === 'false') {
                    updates.is_active = activeText.toLowerCase() === 'true';
                }

                if (Object.keys(updates).length === 0) {
                    return msgData.reply(`Tidak ada bidang yang diubah kak.\n\n${usage}`);
                }

                await product.update(updates);
                await msgData.react('✅');
                return msgData.reply(`Yeay! Produk berhasil diperbarui yaa kak~ (˶˃ ᵕ ˂˶) ✨\n\n🆔 *ID:* \`${product.id}\`\n📦 *Nama:* ${product.name}\n💰 *Harga:* ${formatCurrency(product.price)}\n📊 *Stok:* ${product.stock}\n✔️ *Status:* ${product.is_active ? 'Aktif' : 'Non-Aktif'}`);
            }

            if (subcommand === 'delete') {
                const id = parseInt(args[1], 10);
                if (Number.isNaN(id)) return msgData.reply(`ID produk tidak valid kak.\n\n${usage}`);

                const product = await Product.findByPk(id);
                if (!product) return msgData.reply(`Aduuh kak, produk dengan ID *${id}* tidak ditemukan.. (╥﹏╥)`);

                await product.destroy();
                await msgData.react('✅');
                return msgData.reply(`Berhasil! Produk dengan ID *${id}* telah dihapus dari toko yaa kak~ (˶˃ ᵕ ˂˶)`);
            }

            if (subcommand === 'info') {
                const id = parseInt(args[1], 10);
                if (Number.isNaN(id)) return msgData.reply(`ID produk tidak valid kak.\n\n${usage}`);

                const product = await Product.findByPk(id);
                if (!product) return msgData.reply(`Aduuh kak, produk dengan ID *${id}* tidak ditemukan.. (╥﹏╥)`);

                return msgData.reply(`📄 *DETAIL PRODUK TOKO* 📄\n\n🆔 *ID:* \`${product.id}\`\n📦 *Nama:* ${product.name}\n💰 *Harga:* ${formatCurrency(product.price)}\n📊 *Stok:* ${product.stock}\n✔️ *Status:* ${product.is_active ? 'Aktif' : 'Non-Aktif'}\n📝 *Deskripsi:* ${product.description || '-'}`);
            }

            if (subcommand === 'list') {
                const products = await Product.findAll({ order: [['id', 'ASC']] });
                if (products.length === 0) return msgData.reply('Belum ada produk di toko kak.. (╥﹏╥)');

                const lines = products.map(p => `• *[ID ${p.id}]* ${p.name} — ${formatCurrency(p.price)} (Stok: ${p.stock} | ${p.is_active ? 'Aktif' : 'Off'})`);
                return msgData.reply(`🛍️ *DAFTAR KESELURUHAN PRODUK TOKO*\n\n${lines.join('\n')}`);
            }

            return msgData.reply(`Subcommand tidak dikenal kak.\n\n${usage}`);
        } catch (error) {
            console.error('Store Product Error:', error);
            await msgData.react('❌');
            return msgData.reply(`Uwaaa gawat! Gagal menjalankan perintah product: ${error.message}.. (╥﹏╥)`);
        }
    }
};

