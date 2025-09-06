import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

class TrustedContact extends Model { }

TrustedContact.init(
    {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING },
        relationship: { type: DataTypes.STRING, allowNull: false },
        isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false },
        notificationsEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
        isOnline: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
        sequelize,
        tableName: 'trusted_contacts',
        timestamps: true,
        indexes: [{ fields: ['userId'] }],
    }
);

// Associations
User.hasMany(TrustedContact, { foreignKey: 'userId', as: 'trustedContacts' });
TrustedContact.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default TrustedContact;
