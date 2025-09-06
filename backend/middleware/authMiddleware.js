// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const secret = process.env.JWT_SECRET;

// Authentication middleware
export async function auth(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const payload = jwt.verify(token, secret);
        const user = await User.findById(payload.id).select('-passwordHash');

        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user; // attach user to request
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalid or expired' });
    }
}

// Role-based access middleware
export function requireRole(requiredRoles = []) {
    return (req, res, next) => {
        try {
            if (!req.user || !req.user.role) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (!requiredRoles.length) return next(); // no role restriction

            if (!requiredRoles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            next();
        } catch (err) {
            console.error('Role middleware error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    };
}
