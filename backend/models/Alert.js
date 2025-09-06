import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Alert extends Model {}

Alert.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    type: { 
        type: DataTypes.ENUM('escort_overdue', 'sos', 'checkin_missed', 'safety_alert'), 
        allowNull: false 
    },
    message: { type: DataTypes.TEXT, allowNull: false },
    sessionId: { type: DataTypes.STRING },
    guardians: { type: DataTypes.JSON, defaultValue: [] },
    resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
    resolvedAt: { type: DataTypes.DATE },
    resolvedBy: { type: DataTypes.STRING }
}, {
    sequelize,
    tableName: 'alerts',
    timestamps: true,
    indexes: [
        { fields: ['type'] },
        { fields: ['sessionId'] },
        { fields: ['resolved'] }
    ]
});

export default Alert;
