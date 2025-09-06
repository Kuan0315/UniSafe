import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class GuardianSession extends Model {}

GuardianSession.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    destinationLat: { type: DataTypes.DECIMAL(10, 8) },
    destinationLng: { type: DataTypes.DECIMAL(11, 8) },
    estimatedDuration: { type: DataTypes.INTEGER, allowNull: false }, // in minutes
    trustedContacts: { type: DataTypes.JSON, defaultValue: [] },
    checkIns: { type: DataTypes.JSON, defaultValue: [] },
    currentStatus: { 
        type: DataTypes.ENUM('active', 'completed', 'cancelled', 'overdue', 'emergency'), 
        defaultValue: 'active' 
    },
    startTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    endTime: { type: DataTypes.DATE },
    estimatedArrival: { type: DataTypes.DATE },
    actualArrival: { type: DataTypes.DATE },
    routeDeviations: { type: DataTypes.JSON, defaultValue: [] },
    alertsSent: { type: DataTypes.JSON, defaultValue: [] }
}, {
    sequelize,
    tableName: 'guardian_sessions',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'currentStatus'] }
    ]
});

export default GuardianSession;