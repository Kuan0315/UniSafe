import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Escort extends Model {
    async markComplete() {
        this.status = 'completed';
        this.completedAt = new Date();
        return await this.save();
    }

    async markCancelled() {
        this.status = 'cancelled';
        this.completedAt = new Date();
        return await this.save();
    }

    async markOverdue() {
        this.status = 'overdue';
        this.alertedAt = new Date();
        return await this.save();
    }

    static async findOverdue() {
        const now = new Date();
        return await this.findAll({
            where: {
                status: 'active',
                expectedEnd: { [sequelize.Op.lt]: now }
            }
        });
    }
}

Escort.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    escortId: { type: DataTypes.STRING, allowNull: false, unique: true },
    userName: { type: DataTypes.STRING, allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false },
    expectedEnd: { type: DataTypes.DATE, allowNull: false },
    startTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { 
        type: DataTypes.ENUM('active', 'completed', 'cancelled', 'overdue'), 
        defaultValue: 'active' 
    },
    guardianEmails: { type: DataTypes.JSON, defaultValue: [] },
    shareToken: { type: DataTypes.STRING, allowNull: false },
    completedAt: { type: DataTypes.DATE },
    alertedAt: { type: DataTypes.DATE },
    notes: { type: DataTypes.TEXT }
}, {
    sequelize,
    tableName: 'escorts',
    timestamps: true,
    indexes: [
        { fields: ['escortId'] },
        { fields: ['userName'] },
        { fields: ['status'] },
        { fields: ['shareToken'] },
        { fields: ['expectedEnd'] }
    ]
});

export default Escort;
