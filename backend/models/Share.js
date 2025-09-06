import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Share extends Model {}

Share.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
    userName: { type: DataTypes.STRING, allowNull: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    expiresAt: { type: DataTypes.DATE }
}, {
    sequelize,
    tableName: 'shares',
    timestamps: true,
    indexes: [
        { fields: ['token'] },
        { fields: ['userName'] },
        { fields: ['active'] }
    ]
});

export default Share;
