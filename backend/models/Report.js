import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Report extends Model {
    get formattedDate() {
        return this.createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    get isOpen() {
        return ['Pending', 'Under Review', 'In Progress'].includes(this.status);
    }

    async addNote(note, userId) {
        const notes = this.followUpNotes || [];
        notes.push({
            note,
            addedBy: userId,
            addedAt: new Date()
        });
        this.followUpNotes = notes;
        return await this.save();
    }

    async updateStatus(newStatus, note = null, userId = null) {
        this.status = newStatus;

        if (note && userId) {
            await this.addNote(`Status changed to ${newStatus}: ${note}`, userId);
        }

        if (newStatus === 'Resolved' || newStatus === 'Closed') {
            this.closedAt = new Date();
        }

        return await this.save();
    }

    static async findByStatus(status) {
        return await this.findAll({ 
            where: { status },
            order: [['createdAt', 'DESC']]
        });
    }

    static async findByDateRange(startDate, endDate) {
        return await this.findAll({
            where: {
                createdAt: {
                    [sequelize.Op.gte]: new Date(startDate),
                    [sequelize.Op.lte]: new Date(endDate)
                }
            },
            order: [['createdAt', 'DESC']]
        });
    }
}

Report.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    type: { 
        type: DataTypes.ENUM('Theft', 'Harassment', 'Accident', 'Suspicious Activity', 'Fire', 'Medical Emergency', 'Other'),
        allowNull: false
    },
    description: { 
        type: DataTypes.TEXT, 
        allowNull: false,
        validate: { len: [10, 2000] }
    },
    location: { 
        type: DataTypes.STRING(500), 
        allowNull: false 
    },
    reportedById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { 
        type: DataTypes.ENUM('Pending', 'Under Review', 'In Progress', 'Resolved', 'Closed'),
        defaultValue: 'Pending'
    },
    priority: { 
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        defaultValue: 'Medium'
    },
    details: { type: DataTypes.JSON, defaultValue: {} },
    evidence: { type: DataTypes.JSON, defaultValue: [] },
    coordinatesLat: { 
        type: DataTypes.DECIMAL(10, 8),
        validate: { min: -90, max: 90 }
    },
    coordinatesLng: { 
        type: DataTypes.DECIMAL(11, 8),
        validate: { min: -180, max: 180 }
    },
    coordinatesAccuracy: { type: DataTypes.INTEGER }, // in meters
    anonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
    contactPreference: { 
        type: DataTypes.ENUM('Email', 'Phone', 'None'),
        defaultValue: 'Email'
    },
    preferredContactTimeFrom: { type: DataTypes.STRING }, // e.g., "09:00"
    preferredContactTimeTo: { type: DataTypes.STRING }, // e.g., "17:00"
    emergencyServicesCalled: { type: DataTypes.BOOLEAN },
    emergencyServicesInvolved: { type: DataTypes.JSON, defaultValue: [] },
    emergencyServicesReferenceNumber: { type: DataTypes.STRING },
    followUpAssignedTo: { type: DataTypes.INTEGER.UNSIGNED },
    followUpNotes: { type: DataTypes.JSON, defaultValue: [] },
    followUpResolution: { type: DataTypes.TEXT },
    followUpResolutionDate: { type: DataTypes.DATE },
    closedAt: { type: DataTypes.DATE }
}, {
    sequelize,
    tableName: 'reports',
    timestamps: true,
    indexes: [
        { fields: ['type', 'status'] },
        { fields: ['reportedById', 'createdAt'] },
        { fields: ['createdAt'] },
        { fields: ['coordinatesLat', 'coordinatesLng'] }
    ],
    hooks: {
        beforeSave: (report) => {
            report.updatedAt = new Date();
        }
    }
});

export default Report;