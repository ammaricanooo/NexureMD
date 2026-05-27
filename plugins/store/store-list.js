import Product from '../../databases/orm/Product.js';

const formatCurrency = (value) => {
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    return `Rp ${number.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
};

export default {
    command: ['store', 'products'],
    category: 'store',
    isRegistered: true,
    description: 'Menampilkan daftar produk toko yang aktif.',
    async execute(sock, m, msgData) {
        try {
            const products = await Product.findAll({
                where: { is_active: true },
                order: [['id', 'ASC']]
            });

            if (!products.length) {
                return msgData.reply('Saat ini belum ada produk aktif di toko.');
            }

            const lines = products.map(product => `ID: ${product.id}\nNama: ${product.name}\nHarga: ${formatCurrency(product.price)}\nStok: ${product.stock}\nDeskripsi: ${product.description || '-'}\n---`);
            return msgData.reply(`*Daftar Produk Toko*\n\n${lines.join('\n')}`);
        } catch (error) {
            console.error('Store List Error:', error);
            return msgData.reply(`Gagal menampilkan daftar produk: ${error.message}`);
        }
    }
};
