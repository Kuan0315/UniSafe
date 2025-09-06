import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { SOS_SEVERITY } from '../config/constants.js';

class SOSAlert extends Model {
    get formattedTime() {
        return this.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    get duration() {
        if (this.resolvedAt) return Math.round((this.resolvedAt - this.createdAt) / 1000);
        return Math.round((Date.now() - this.createdAt) / 1000);
    }

    async resolve(userId, notes = '') {
        this.status = 'resolved';
        this.handledBy = userId;
        this.resolvedAt = new Date();
        this.notes = notes;
        return await this.save();
    }

    static async findActive() {
        return await this.findAll({ 
            where: { status: 'active' },
            order: [['createdAt', 'DESC']]
        });
    }
}

SOSAlert.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    message: { type: DataTypes.STRING, defaultValue: 'Emergency SOS activated' },
    summary: { type: DataTypes.TEXT },
    severity: {
        type: DataTypes.ENUM(Object.values(SOS_SEVERITY)),
        defaultValue: SOS_SEVERITY.HIGH
    },
    locationType: { type: DataTypes.STRING, defaultValue: 'Point' },
    locationLat: { type: DataTypes.DECIMAL(10, 8) },
    locationLng: { type: DataTypes.DECIMAL(11, 8) },
    locationAddress: { type: DataTypes.STRING, defaultValue: 'Location not available' },
    status: { 
        type: DataTypes.ENUM('active', 'resolved', 'cancelled'), 
        defaultValue: 'active' 
    },
    triggeredBy: { 
        type: DataTypes.ENUM('manual', 'automatic', 'guardian'), 
        defaultValue: 'manual' 
    },
    handledBy: { type: DataTypes.INTEGER.UNSIGNED },
    photoCaptured: { type: DataTypes.BOOLEAN, defaultValue: false },
    videoRecording: { type: DataTypes.BOOLEAN, defaultValue: false },
    locationObtained: { type: DataTypes.BOOLEAN, defaultValue: false },
    contactsNotified: { type: DataTypes.BOOLEAN, defaultValue: false },
    mediaPhotos: { type: DataTypes.JSON, defaultValue: [] },
    mediaVideos: { type: DataTypes.JSON, defaultValue: [] },
    emergencyServicesCalled: { type: DataTypes.BOOLEAN, defaultValue: false },
    emergencyServicesCallTime: { type: DataTypes.DATE },
    emergencyServicesReferenceNumber: { type: DataTypes.STRING },
    contacts: { type: DataTypes.JSON, defaultValue: [] },
    resolvedAt: { type: DataTypes.DATE },
    respondedBy: { type: DataTypes.INTEGER.UNSIGNED },
    notes: { type: DataTypes.TEXT }
}, {
    sequelize,
    tableName: 'sos_alerts',
    timestamps: true,
    indexes: [
        { fields: ['status', 'createdAt'] },
        { fields: ['userId', 'createdAt'] },
        { fields: ['userId', 'status'] }
    ]
});

export default SOSAlert;
