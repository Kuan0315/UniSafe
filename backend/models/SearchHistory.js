import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class SearchHistory extends Model {}

SearchHistory.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    query: { type: DataTypes.STRING, allowNull: false }, // what user searched
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW } // when they searched
}, {
    sequelize,
    tableName: 'search_history',
    timestamps: false,
    indexes: [
        { fields: ['userId'] },
        { fields: ['timestamp'] }
    ]
});

export default SearchHistory;

