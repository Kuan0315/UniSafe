import { DataTypes, Model, Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';

class User extends Model {
    // Compare plaintext password with hashed password
    async comparePassword(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    }

    // Get nearby users (spatial query)
    static async findNearbyUsers(lat, lng, radius = 1000, excludeUserId = null) {
        const whereClause = {
            location: { [Op.ne]: null },
            isActive: true
        };

        if (excludeUserId) {
            whereClause.id = { [Op.ne]: excludeUserId };
        }

        return await this.findAll({
            where: whereClause,
            attributes: [
                'id',
                'name',
                'email',
                'role',
                'location',
                'lastSeen',
                [
                    sequelize.literal(`
                        ST_Distance_Sphere(
                            location,
                            ST_GeomFromText('POINT(${lng} ${lat})')
                        )
                    `),
                    'distance'
                ]
            ],
            having: sequelize.literal(`distance <= ${radius}`),
            order: [['distance', 'ASC']]
        });
    }
}

User.init(
    {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING(100), allowNull: false },
        email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        password: { type: DataTypes.STRING(255), allowNull: false },

        role: { type: DataTypes.ENUM('student', 'staff', 'security', 'admin', 'guest'), defaultValue: 'student' },
        studentId: { type: DataTypes.STRING(20), allowNull: true, unique: true }, // ✅ keep only one
        phone: { type: DataTypes.STRING(20), allowNull: true },

        // Location tracking
        location: { 
            type: DataTypes.GEOMETRY('POINT'),
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('location');
                return rawValue ? { coordinates: rawValue.coordinates } : null;
            },
            set(value) {
                if (value && value.coordinates) {
                    this.setDataValue('location', { 
                        type: 'Point', 
                        coordinates: value.coordinates 
                    });
                }
            }
        },
        lastSeen: { type: DataTypes.DATE, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

        // FollowMe/live location sharing
        followMe: {
            type: DataTypes.JSON,
            defaultValue: {
                isActive: false,
                lastLocation: null,
                sharingWith: [],
                shareToken: null,
                shareExpires: null
            }
        },

        googleId: { type: DataTypes.STRING(100), allowNull: true },
        avatar: { type: DataTypes.STRING(255), allowNull: true },

        isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        verificationToken: { type: DataTypes.STRING(100), allowNull: true },
        resetPasswordToken: { type: DataTypes.STRING(100), allowNull: true },
        resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },

        preferences: { type: DataTypes.JSON, defaultValue: {
            notifications: true,
            locationSharing: false,
            emergencyAlerts: true,
            theme: 'light'
        }},
        privacySettings: { type: DataTypes.JSON, defaultValue: {
            showLocation: 'contacts',
            showProfile: 'public',
            showLastSeen: 'contacts'
        }},

        emergencyContacts: { type: DataTypes.JSON, defaultValue: [] },
        trustedCircle: { type: DataTypes.JSON, defaultValue: [] },

        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        indexes: [
            { fields: ['email'] },
            { fields: ['studentId'] },
            { fields: ['role'] },
            { fields: ['isActive'] },
       
            { fields: ['lastSeen'] }
        ],
        hooks: {
            beforeSave: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
                
                // Update lastSeen when location changes
                if (user.changed('location') && user.location) {
                    user.lastSeen = new Date();
                }
            },
        },
    }
);

export default User;
