import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class CallLog extends Model {}

CallLog.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    sosId: { type: DataTypes.INTEGER.UNSIGNED },
    type: { 
        type: DataTypes.ENUM('voice', 'video', 'manual'), 
        defaultValue: 'voice' 
    },
    providerResponse: { type: DataTypes.JSON },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    tableName: 'call_logs',
    timestamps: false,
    indexes: [
        { fields: ['userId'] },
        { fields: ['sosId'] },
        { fields: ['type'] }
    ]
});

export default CallLog;

