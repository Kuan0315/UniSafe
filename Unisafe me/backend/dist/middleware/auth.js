"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token)
            return res.status(401).json({ error: 'Unauthorized' });
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error('JWT_SECRET not set');
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.auth = payload;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
