import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class LocationUpdate extends Model {
    get estimatedCompletion() {
        if (!this.startedAt) return null;
        const completionTime = new Date(this.startedAt);
        completionTime.setMinutes(completionTime.getMinutes() + this.eta);
        return completionTime;
    }

    get timeRemaining() {
        if (!this.startedAt || this.status !== 'active') return 0;
        const elapsed = (new Date() - this.startedAt) / 60000; // minutes
        return Math.max(0, this.eta - elapsed);
    }

    get isOverdue() {
        if (this.status !== 'active' || !this.startedAt) return false;
        const expectedEnd = new Date(this.startedAt);
        expectedEnd.setMinutes(expectedEnd.getMinutes() + this.eta);
        return new Date() > expectedEnd;
    }

    async updateProgress(newProgress, location = null) {
        this.progress = Math.min(100, Math.max(0, newProgress));

        if (location) {
            this.currentLocationLat = location.lat;
            this.currentLocationLng = location.lng;
            this.currentLocationAddress = location.address;
            this.currentLocationTimestamp = new Date();
        }

        if (this.progress >= 100 && this.status === 'active') {
            this.status = 'completed';
            this.completedAt = new Date();
        }

        return await this.save();
    }

    async addTrustedContact(contactId) {
        const contacts = this.trustedContacts || [];
        if (!contacts.includes(contactId)) {
            contacts.push(contactId);
            this.trustedContacts = contacts;
        }
        return await this.save();
    }

    async removeTrustedContact(contactId) {
        const contacts = this.trustedContacts || [];
        this.trustedContacts = contacts.filter(contact => contact !== contactId);
        return await this.save();
    }

    static async findActiveByUser(userId) {
        return await this.findAll({ 
            where: { userId, status: 'active' },
            order: [['createdAt', 'DESC']]
        });
    }

    static async findByTrustedContact(contactId) {
        return await this.findAll({
            where: {
                trustedContacts: sequelize.literal(`JSON_CONTAINS(trustedContacts, '${contactId}')`),
                status: 'active'
            }
        });
    }
}

LocationUpdate.init({
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
    tableName: 'location_updates',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'status'] },
        { fields: ['status', 'createdAt'] }
    ],
    hooks: {
        beforeSave: (trip) => {
            if (trip.status === 'completed' && !trip.completedAt) {
                trip.completedAt = new Date();
            }
            if (trip.status === 'cancelled' && !trip.cancelledAt) {
                trip.cancelledAt = new Date();
            }
        }
    }
});

export default LocationUpdate;
