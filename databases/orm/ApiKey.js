import { DataTypes } from 'sequelize';
import sequelize from '../connector.js';
import crypto from 'crypto';

const ApiKey = sequelize.define('ApiKey', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Nama API Key (misal: Web App, Mobile App)'
    },
    key: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        comment: 'API Key string yang di-hash'
    },
    key_prefix: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Prefix key untuk display (misal: sk_live_abc...)'
    },
    owner_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Nomor WhatsApp owner yang membuat key'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Deskripsi penggunaan API Key'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Status aktif/nonaktif key'
    },
    last_used: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Waktu terakhir key digunakan'
    },
    request_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Total request menggunakan key ini'
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Tanggal expiration (null = tidak pernah expired)'
    }
}, {
    tableName: 'api_keys',
    timestamps: true,
});

/**
 * Generate API Key baru
 * @returns {Object} {key: string, prefix: string}
 */
export function generateApiKey() {
    const key = crypto.randomBytes(32).toString('hex');
    const prefix = `sk_${key.substring(0, 8)}`;
    return { key, prefix };
}

/**
 * Hash API Key untuk disimpan di database
 * @param {string} key - Raw API Key
 * @returns {string} Hashed key
 */
export function hashApiKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify API Key
 * @param {string} rawKey - Raw key dari request
 * @param {string} hashedKey - Hashed key dari database
 * @returns {boolean}
 */
export function verifyApiKey(rawKey, hashedKey) {
    const rawHashed = crypto.createHash('sha256').update(rawKey).digest('hex');
    return rawHashed === hashedKey;
}

export default ApiKey;
