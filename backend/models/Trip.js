import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Trip extends Model {}

Trip.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    startLocationLat: { type: DataTypes.DECIMAL(10, 8) },
    startLocationLng: { type: DataTypes.DECIMAL(11, 8) },
    startLocationAddress: { type: DataTypes.STRING },
    currentLocationLat: { type: DataTypes.DECIMAL(10, 8) },
    currentLocationLng: { type: DataTypes.DECIMAL(11, 8) },
    currentLocationAddress: { type: DataTypes.STRING },
    currentLocationTimestamp: { type: DataTypes.DATE },
    eta: { type: DataTypes.INTEGER, allowNull: false }, // in minutes
    checkInInterval: { type: DataTypes.INTEGER, defaultValue: 5 }, // in minutes
    progress: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0,
        validate: { min: 0, max: 100 }
    },
    status: { 
        type: DataTypes.ENUM('active', 'completed', 'cancelled'), 
        defaultValue: 'active' 
    },
    trustedContacts: { type: DataTypes.JSON, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    startedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    completedAt: { type: DataTypes.DATE },
    cancelledAt: { type: DataTypes.DATE },
    routePolyline: { type: DataTypes.TEXT },
    routeDistance: { type: DataTypes.INTEGER }, // in meters
    routeDuration: { type: DataTypes.INTEGER } // in seconds
}, {
    sequelize,
    tableName: 'trips',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'status'] },
        { fields: ['status', 'createdAt'] }
    ]
});

export default Trip;
