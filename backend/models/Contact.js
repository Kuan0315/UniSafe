// models/Contact.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Contact extends Model {}

Contact.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    relationship: { type: DataTypes.STRING },
    isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    sequelize,
    tableName: 'contacts',
    timestamps: true,
    indexes: [
        { fields: ['userId'] }
    ]
});

export default Contact;

