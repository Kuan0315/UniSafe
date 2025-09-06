// middleware/requireRole.js

export default function requireRole(requiredRoles = []) {
    return (req, res, next) => {
        try {
            // Ensure user is authenticated
            if (!req.user || !req.user.role) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // If no roles are required, allow access
            if (!requiredRoles.length) return next();

            // Check if user's role is allowed
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

