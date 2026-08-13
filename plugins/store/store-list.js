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
                return msgData.reply('Aduuh kak, saat ini belum ada produk aktif di toko kami.. (╥﹏╥)');
            }

            let text = `🛍️ *DAFTAR PRODUK TOKO NEXURE* 🛍️\n\n`;
            products.forEach(p => {
                text += `┌─「 *${p.name}* 」\n`;
                text += `│ 🆔 *ID     :* \`${p.id}\`\n`;
                text += `│ 💰 *Harga  :* ${formatCurrency(p.price)}\n`;
                text += `│ 📦 *Stok   :* ${p.stock}\n`;
                if (p.description) text += `│ 📝 *Info   :* ${p.description}\n`;
                text += `└─────────────┈\n\n`;
            });
            text += `Silakan hubungi admin untuk melakukan pemesanan yaa kak! (˶˃ ᵕ ˂˶) ✨`;

            return msgData.reply(text.trim());
        } catch (error) {
            console.error('Store List Error:', error);
            await msgData.react('❌');
            return msgData.reply(`Uwaaa gawat! Gagal menampilkan daftar produk: ${error.message}.. (╥﹏╥)`);
        }
    }
};

