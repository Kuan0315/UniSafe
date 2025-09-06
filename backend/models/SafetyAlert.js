import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class SafetyAlert extends Model {
    get formattedAddress() {
        const parts = [];
        if (this.locationBuilding) parts.push(this.locationBuilding);
        if (this.locationRoom) parts.push(`Room ${this.locationRoom}`);
        if (this.locationFloor) parts.push(`Floor ${this.locationFloor}`);
        if (this.locationArea) parts.push(this.locationArea);
        if (this.locationAddress) parts.push(this.locationAddress);
        return parts.join(', ') || 'Location not specified';
    }

    get timeAgo() {
        const now = new Date();
        const diff = now - this.createdAt;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    get isActive() {
        return this.status === 'active' || this.status === 'under_investigation';
    }

    async resolveAlert(userId, notes = '', actions = []) {
        this.status = 'resolved';
        this.resolvedById = userId;
        this.resolvedAt = new Date();
        this.resolutionNotes = notes;

        if (actions && actions.length > 0) {
            const currentActions = this.followUpActions || [];
            this.followUpActions = [...currentActions, ...actions];
        }

        return await this.save();
    }

    async addEvidence(evidenceData) {
        const evidence = this.evidence || [];
        evidence.push({
            ...evidenceData,
            uploadedAt: new Date()
        });
        this.evidence = evidence;
        return await this.save();
    }

    async addWitness(witnessData) {
        const witnesses = this.witnesses || [];
        witnesses.push(witnessData);
        this.witnesses = witnesses;
        return await this.save();
    }

    async updateNotificationStatus(type, count = 0) {
        const notificationType = type.toLowerCase();

        if (['push', 'email', 'sms'].includes(notificationType)) {
            this[`${notificationType}Sent`] = true;
            this[`${notificationType}SentAt`] = new Date();
            this[`${notificationType}Recipients`] = count;
        }

        return await this.save();
    }

    static async findActiveForArea(area, severity = null) {
        const filter = {
            status: { [sequelize.Op.in]: ['active', 'under_investigation'] },
            [sequelize.Op.or]: [
                { locationArea: area },
                sequelize.literal(`JSON_CONTAINS(affectedAreaAreas, '"${area}"')`),
                sequelize.literal(`JSON_CONTAINS(affectedAreaBuildings, '"${area}"')`)
            ]
        };

        if (severity) {
            filter.severity = severity;
        }

        return await this.findAll({
            where: filter,
            order: [['severity', 'DESC'], ['createdAt', 'DESC']]
        });
    }

    static async getStatistics(timeRange = '24h') {
        const timeFilters = {
            '24h': { createdAt: { [sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            '7d': { createdAt: { [sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            '30d': { createdAt: { [sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } 
        };

        const filter = timeFilters[timeRange] || {};
        const alerts = await this.findAll({ where: filter });

        const stats = {
            total: alerts.length,
            active: alerts.filter(a => ['active', 'under_investigation'].includes(a.status)).length,
            byCategory: {},
            bySeverity: {},
            byStatus: {}
        };

        alerts.forEach(alert => {
            stats.byCategory[alert.category] = (stats.byCategory[alert.category] || 0) + 1;
            stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
            stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
        });

        return stats;
    }
}

SafetyAlert.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { 
        type: DataTypes.STRING(200), 
        allowNull: false 
    },
    description: { 
        type: DataTypes.STRING(1000), 
        allowNull: false 
    },
    category: { 
        type: DataTypes.ENUM('theft', 'assault', 'fire', 'medical', 'weather', 'traffic', 'other'),
        allowNull: false
    },
    severity: { 
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
    },
    locationLat: { 
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
        validate: { min: -90, max: 90 }
    },
    locationLng: { 
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
        validate: { min: -180, max: 180 }
    },
    locationAddress: { type: DataTypes.STRING },
    locationBuilding: { type: DataTypes.STRING },
    locationArea: { 
        type: DataTypes.ENUM('engineering', 'science', 'arts', 'library', 'dormitory', 'sports', 'cafeteria', 'parking', 'main-campus', 'north-campus', 'south-campus', 'east-campus', 'west-campus')
    },
    locationFloor: { type: DataTypes.STRING },
    locationRoom: { type: DataTypes.STRING },
    reportedById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { 
        type: DataTypes.ENUM('active', 'resolved', 'false_alarm', 'under_investigation'),
        defaultValue: 'active'
    },
    isAnonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
    isEmergency: { type: DataTypes.BOOLEAN, defaultValue: false },
    affectedAreaRadius: { 
        type: DataTypes.INTEGER,
        defaultValue: 500,
        validate: { min: 50, max: 5000 }
    },
    affectedAreaBuildings: { type: DataTypes.JSON, defaultValue: [] },
    affectedAreaAreas: { type: DataTypes.JSON, defaultValue: [] },
    affectedAreaFloors: { type: DataTypes.JSON, defaultValue: [] },
    pushSent: { type: DataTypes.BOOLEAN, defaultValue: false },
    pushSentAt: { type: DataTypes.DATE },
    pushRecipients: { type: DataTypes.INTEGER, defaultValue: 0 },
    emailSent: { type: DataTypes.BOOLEAN, defaultValue: false },
    emailSentAt: { type: DataTypes.DATE },
    emailRecipients: { type: DataTypes.INTEGER, defaultValue: 0 },
    smsSent: { type: DataTypes.BOOLEAN, defaultValue: false },
    smsSentAt: { type: DataTypes.DATE },
    smsRecipients: { type: DataTypes.INTEGER, defaultValue: 0 },
    evidence: { type: DataTypes.JSON, defaultValue: [] },
    witnesses: { type: DataTypes.JSON, defaultValue: [] },
    resolvedById: { type: DataTypes.INTEGER.UNSIGNED },
    resolvedAt: { type: DataTypes.DATE },
    resolutionNotes: { type: DataTypes.TEXT },
    followUpActions: { type: DataTypes.JSON, defaultValue: [] },
    priority: { 
        type: DataTypes.INTEGER,
        defaultValue: 5,
        validate: { min: 1, max: 10 }
    },
    estimatedResolutionTime: { type: DataTypes.INTEGER }, // in minutes
    tags: { type: DataTypes.JSON, defaultValue: [] },
    relatedIncidents: { type: DataTypes.JSON, defaultValue: [] },
    isTest: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    sequelize,
    tableName: 'safety_alerts',
    timestamps: true,
    indexes: [
        { fields: ['status', 'createdAt'] },
        { fields: ['category', 'severity'] },
        { fields: ['locationArea', 'status'] },
        { fields: ['isEmergency', 'status'] },
        { fields: ['reportedById', 'createdAt'] },
        { fields: ['severity', 'createdAt'] },
        { fields: ['createdAt'] }
    ],
    hooks: {
        beforeSave: (alert) => {
            if (alert.severity === 'critical' || alert.severity === 'high') {
                alert.isEmergency = true;
            } else {
                alert.isEmergency = false;
            }

            const priorityMap = {
                critical: 10,
                high: 8,
                medium: 5,
                low: 3
            };
            alert.priority = priorityMap[alert.severity] || 5;
        }
    }
});

export default SafetyAlert;
