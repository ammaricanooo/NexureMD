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

        const usage = `*Penggunaan Produk Toko:*
.product add <nama>|<harga>|<stok>|<deskripsi>
.product update <id>|<nama>|<harga>|<stok>|<deskripsi>|<aktif>
.product delete <id>
.product info <id>
.product list

Contoh:
.product add Kaos Keren|75000|10|Kaos distro kualitas premium
.product update 2|Kaos Keren|85000|8|Stok baru tersedia|true`;

        if (!subcommand || subcommand === 'help') {
            return msgData.reply(usage);
        }

        try {
            if (subcommand === 'add') {
                const payload = args.slice(1).join(' ');
                if (!payload) return msgData.reply('Format tidak lengkap. ' + usage);

                const [name, priceText, stockText, description = ''] = payload.split('|').map(p => p.trim());
                if (!name || !priceText || !stockText) return msgData.reply('Nama, harga, dan stok wajib diisi. ' + usage);

                const price = parseFloat(priceText.replace(/,/g, '.'));
                const stock = parseInt(stockText, 10);
                if (Number.isNaN(price) || price < 0) return msgData.reply('Harga tidak valid. Gunakan angka seperti 75000.');
                if (Number.isNaN(stock) || stock < 0) return msgData.reply('Stok tidak valid. Gunakan angka bulat minimal 0.');

                const product = await Product.create({
                    name,
                    price,
                    stock,
                    description,
                    created_by: msgData.senderJid
                });

                return msgData.reply(`✅ Produk berhasil ditambahkan:\nID: ${product.id}\nNama: ${product.name}\nHarga: ${formatCurrency(product.price)}\nStok: ${product.stock}`);
            }

            if (subcommand === 'update') {
                const payload = args.slice(1).join(' ');
                if (!payload) return msgData.reply('Format tidak lengkap. ' + usage);

                const [idText, name, priceText, stockText, description = '', activeText = ''] = payload.split('|').map(p => p.trim());
                const id = parseInt(idText, 10);
                if (Number.isNaN(id)) return msgData.reply('ID produk tidak valid.');

                const product = await Product.findByPk(id);
                if (!product) return msgData.reply(`Produk dengan ID ${id} tidak ditemukan.`);

                const updates = {};
                if (name) updates.name = name;
                if (priceText) {
                    const price = parseFloat(priceText.replace(/,/g, '.'));
                    if (Number.isNaN(price) || price < 0) return msgData.reply('Harga tidak valid.');
                    updates.price = price;
                }
                if (stockText) {
                    const stock = parseInt(stockText, 10);
                    if (Number.isNaN(stock) || stock < 0) return msgData.reply('Stok tidak valid.');
                    updates.stock = stock;
                }
                updates.description = description;
                if (activeText.toLowerCase() === 'true' || activeText.toLowerCase() === 'false') {
                    updates.is_active = activeText.toLowerCase() === 'true';
                }

                if (Object.keys(updates).length === 0) {
                    return msgData.reply('Tidak ada bidang yang diubah. ' + usage);
                }

                await product.update(updates);
                return msgData.reply(`✅ Produk berhasil diperbarui:\nID: ${product.id}\nNama: ${product.name}\nHarga: ${formatCurrency(product.price)}\nStok: ${product.stock}\nAktif: ${product.is_active ? 'Ya' : 'Tidak'}`);
            }

            if (subcommand === 'delete') {
                const id = parseInt(args[1], 10);
                if (Number.isNaN(id)) return msgData.reply('ID produk tidak valid. ' + usage);

                const product = await Product.findByPk(id);
                if (!product) return msgData.reply(`Produk dengan ID ${id} tidak ditemukan.`);

                await product.destroy();
                return msgData.reply(`✅ Produk dengan ID ${id} berhasil dihapus.`);
            }

            if (subcommand === 'info') {
                const id = parseInt(args[1], 10);
                if (Number.isNaN(id)) return msgData.reply('ID produk tidak valid. ' + usage);

                const product = await Product.findByPk(id);
                if (!product) return msgData.reply(`Produk dengan ID ${id} tidak ditemukan.`);

                return msgData.reply(`*Detail Produk*\nID: ${product.id}\nNama: ${product.name}\nHarga: ${formatCurrency(product.price)}\nStok: ${product.stock}\nAktif: ${product.is_active ? 'Ya' : 'Tidak'}\nDeskripsi: ${product.description || '-'}`);
            }

            if (subcommand === 'list') {
                const products = await Product.findAll({ order: [['id', 'ASC']] });
                if (products.length === 0) return msgData.reply('Belum ada produk di toko.');

                const lines = products.map(product => `ID: ${product.id} | ${product.name} | ${formatCurrency(product.price)} | Stok: ${product.stock} | Aktif: ${product.is_active ? 'Ya' : 'Tidak'}`);
                return msgData.reply(`*Daftar Produk Toko*\n\n${lines.join('\n')}`);
            }

            return msgData.reply('Subcommand tidak dikenal. ' + usage);
        } catch (error) {
            console.error('Store Product Error:', error);
            return msgData.reply(`Gagal menjalankan perintah product: ${error.message}`);
        }
    }
};
