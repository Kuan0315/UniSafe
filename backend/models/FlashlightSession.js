import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class FlashlightSession extends Model {
    get timeRemaining() {
        if (this.status !== 'active' || !this.startedAt) return 0;
        const elapsed = (new Date() - this.startedAt) / 1000;
        return Math.max(0, this.duration - elapsed);
    }

    get isActive() {
        return this.status === 'active' && this.timeRemaining > 0;
    }

    async stop() {
        this.status = 'stopped';
        this.endedAt = new Date();
        return await this.save();
    }

    static async findExpired() {
        return await this.findAll({
            where: {
                status: 'active',
                startedAt: {
                    [sequelize.Op.lt]: new Date(Date.now() - 3600000) // older than 1 hour
                }
            }
        });
    }
}

FlashlightSession.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    duration: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        validate: { min: 30, max: 3600 } // 30 seconds to 1 hour
    },
    intensity: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        validate: { min: 0, max: 100 } // percentage 0-100
    },
    pattern: { 
        type: DataTypes.ENUM('steady', 'strobe', 'sos', 'pulse', 'custom'), 
        defaultValue: 'steady' 
    },
    customPatternOnDuration: { type: DataTypes.INTEGER }, // milliseconds
    customPatternOffDuration: { type: DataTypes.INTEGER }, // milliseconds
    customPatternRepeat: { type: DataTypes.INTEGER },
    status: { 
        type: DataTypes.ENUM('active', 'stopped', 'completed', 'cancelled'), 
        defaultValue: 'active' 
    },
    isEmergency: { type: DataTypes.BOOLEAN, defaultValue: false },
    startedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    endedAt: { type: DataTypes.DATE },
    batteryLevelAtStart: { type: DataTypes.INTEGER },
    batteryLevelAtEnd: { type: DataTypes.INTEGER }
}, {
    sequelize,
    tableName: 'flashlight_sessions',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'status'] },
        { fields: ['createdAt'] },
        { fields: ['isEmergency'] }
    ],
    hooks: {
        beforeSave: (session) => {
            if (session.status === 'active' && session.timeRemaining <= 0) {
                session.status = 'completed';
                session.endedAt = new Date();
            }
        }
    }
});

export default FlashlightSession;
