// models/Incident.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Incident extends Model {
    get isResolved() {
        return this.status === 'resolved';
    }

    async markResolved() {
        this.status = 'resolved';
        this.resolvedAt = new Date();
        return await this.save();
    }
}

Incident.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    type: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        defaultValue: 'other' 
    },
    description: { type: DataTypes.TEXT, allowNull: false },
    locationLat: { type: DataTypes.DECIMAL(10, 8) },
    locationLng: { type: DataTypes.DECIMAL(11, 8) },
    locationAddress: { type: DataTypes.STRING },
    reportedBy: { type: DataTypes.INTEGER.UNSIGNED },
    reporter: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    coordinates: { type: DataTypes.JSON, defaultValue: [] },
    address: { type: DataTypes.STRING },
    building: { type: DataTypes.STRING },
    floor: { type: DataTypes.STRING },
    isAnonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
    media: { type: DataTypes.JSON, defaultValue: [] },
    status: { 
        type: DataTypes.ENUM('reported', 'under_investigation', 'resolved', 'false_alarm'), 
        defaultValue: 'reported' 
    },
    severity: { 
        type: DataTypes.ENUM('low', 'medium', 'high'), 
        defaultValue: 'medium' 
    },
    assignedTo: { type: DataTypes.INTEGER.UNSIGNED },
    priority: { 
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), 
        defaultValue: 'medium' 
    },
    notes: { type: DataTypes.TEXT },
    resolvedAt: { type: DataTypes.DATE }
}, {
    sequelize,
    tableName: 'incidents',
    timestamps: true,
    indexes: [
        { fields: ['status', 'priority'] },
        { fields: ['reportedBy'] },
        { fields: ['locationLat', 'locationLng'] },
        { fields: ['type', 'status'] }
    ]
});

export default Incident;
