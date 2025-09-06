import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class FollowMe extends Model {}

FollowMe.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
    startedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    sharingWith: { type: DataTypes.JSON, defaultValue: [] },
    currentLocationLat: { type: DataTypes.DECIMAL(10, 8) },
    currentLocationLng: { type: DataTypes.DECIMAL(11, 8) },
    currentLocationAccuracy: { type: DataTypes.DECIMAL(10, 2) },
    currentLocationTimestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    currentLocationAddress: { type: DataTypes.STRING },
    locationHistory: { type: DataTypes.JSON, defaultValue: [] },
    updateInterval: { type: DataTypes.INTEGER, defaultValue: 30 }, // seconds
    maxHistoryPoints: { type: DataTypes.INTEGER, defaultValue: 100 },
    shareLocation: { type: DataTypes.BOOLEAN, defaultValue: true },
    shareAddress: { type: DataTypes.BOOLEAN, defaultValue: true },
    status: { 
        type: DataTypes.ENUM('active', 'paused', 'stopped'), 
        defaultValue: 'active' 
    }
}, {
    sequelize,
    tableName: 'follow_me',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'isActive'] },
        { fields: ['expiresAt'] }
    ]
});

export default FollowMe;

