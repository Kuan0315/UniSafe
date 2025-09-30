import jwt from 'jsonwebtoken';
export function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token)
            return res.status(401).json({ error: 'Unauthorized' });
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error('JWT_SECRET not set');
        const payload = jwt.verify(token, secret);
        req.auth = payload;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
