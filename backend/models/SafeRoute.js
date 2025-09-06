import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class SafeRoute extends Model {}

SafeRoute.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    description: { type: DataTypes.TEXT },
    startLocationLat: { 
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    startLocationLng: { 
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    startLocationName: { type: DataTypes.STRING },
    endLocationLat: { 
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    endLocationLng: { 
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    endLocationName: { type: DataTypes.STRING },
    waypoints: { type: DataTypes.JSON, defaultValue: [] },
    routeType: { 
        type: DataTypes.ENUM('walking', 'cycling', 'driving', 'public_transport'),
        defaultValue: 'walking'
    },
    safetyLevel: { 
        type: DataTypes.ENUM('very_safe', 'safe', 'moderate', 'avoid'),
        defaultValue: 'safe'
    },
    wellLit: { type: DataTypes.BOOLEAN, defaultValue: false },
    populated: { type: DataTypes.BOOLEAN, defaultValue: false },
    hasSecurity: { type: DataTypes.BOOLEAN, defaultValue: false },
    hasEmergencyPhones: { type: DataTypes.BOOLEAN, defaultValue: false },
    hasCCTV: { type: DataTypes.BOOLEAN, defaultValue: false },
    estimatedTime: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    }, // in minutes
    distance: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    }, // in meters
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdById: { type: DataTypes.INTEGER.UNSIGNED },
    lastUpdated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    usageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    ratingAverage: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
    ratingCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    sequelize,
    tableName: 'safe_routes',
    timestamps: true,
    indexes: [
        { fields: ['safetyLevel', 'isActive'] },
        { fields: ['routeType'] },
        { fields: ['createdById'] }
    ]
});

export default SafeRoute;




