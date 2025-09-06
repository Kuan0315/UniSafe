import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Notification extends Model {}

Notification.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    recipientId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { 
        type: DataTypes.ENUM('sos', 'safety_alert', 'system'), 
        allowNull: false 
    },
    priority: { 
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'), 
        defaultValue: 'normal' 
    },
    alertId: { type: DataTypes.INTEGER.UNSIGNED },
    locationLat: { type: DataTypes.DECIMAL(10, 8) },
    locationLng: { type: DataTypes.DECIMAL(11, 8) },
    read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        { fields: ['recipientId'] },
        { fields: ['type'] },
        { fields: ['read'] }
    ]
});

export default Notification;

