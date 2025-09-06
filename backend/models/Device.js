import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Device extends Model {}

Device.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    deviceId: { type: DataTypes.STRING, allowNull: false }, // client-generated device id
    platform: { 
        type: DataTypes.ENUM('android', 'ios', 'web'), 
        defaultValue: 'web' 
    },
    pushToken: { type: DataTypes.STRING, defaultValue: '' }, // for push notifications
    lastSeenAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    tableName: 'devices',
    timestamps: true,
    indexes: [
        { 
            fields: ['deviceId', 'userId'], 
            unique: true 
        }
    ]
});

export default Device;

