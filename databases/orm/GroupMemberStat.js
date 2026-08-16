import { DataTypes } from 'sequelize';
import sequelize from '../connector.js';

/**
 * Model untuk tracking jumlah pesan member per grup.
 * Primary key composite: (group_jid, member_jid)
 */
const GroupMemberStat = sequelize.define('GroupMemberStat', {
    group_jid: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    member_jid: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    member_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    message_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
}, {
    tableName: 'group_member_stats',
    timestamps: true,
    indexes: [
        {
            // Index untuk mempercepat query ORDER BY message_count per grup
            fields: ['group_jid', 'message_count']
        }
    ]
});

export default GroupMemberStat;
