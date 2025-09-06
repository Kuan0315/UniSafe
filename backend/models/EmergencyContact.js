import { DataTypes } from "sequelize";
import {sequelize }from "../config/database.js";

const EmergencyContact = sequelize.define("EmergencyContact", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM("emergency", "campus", "health"),
        defaultValue: "campus",
    },
}, {
    tableName: "emergency_contacts",
    timestamps: true, // add createdAt/updatedAt
});

export default EmergencyContact;
