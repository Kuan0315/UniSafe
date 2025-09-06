import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Checkin extends Model {}

Checkin.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tripId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    scheduledFor: { type: DataTypes.DATE, allowNull: false },
    status: { 
        type: DataTypes.ENUM('pending', 'completed', 'missed', 'emergency'), 
        defaultValue: 'pending' 
    },
    completedAt: { type: DataTypes.DATE },
    responseIsSafe: { type: DataTypes.BOOLEAN },
    responseMessage: { type: DataTypes.TEXT },
    responseLocationLat: { type: DataTypes.DECIMAL(10, 8) },
    responseLocationLng: { type: DataTypes.DECIMAL(11, 8) },
    responseLocationAddress: { type: DataTypes.STRING },
    reminderSent: { type: DataTypes.BOOLEAN, defaultValue: false },
    reminderSentAt: { type: DataTypes.DATE },
    notificationSent: { type: DataTypes.BOOLEAN, defaultValue: false },
    notificationSentAt: { type: DataTypes.DATE }
}, {
    sequelize,
    tableName: 'checkins',
    timestamps: true,
    indexes: [
        { fields: ['tripId'] },
        { fields: ['userId'] },
        { fields: ['scheduledFor'] },
        { fields: ['status'] }
    ]
});

export default Checkin;
