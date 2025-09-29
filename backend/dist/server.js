"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const contacts_1 = __importDefault(require("./routes/contacts"));
const guardian_1 = __importDefault(require("./routes/guardian"));
const locations_1 = __importDefault(require("./routes/locations"));
const universities_1 = __importDefault(require("./routes/universities"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:19006';
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: clientOrigin, credentials: true }));
app.use(express_1.default.json({ limit: '1mb' }));
app.use((0, morgan_1.default)('dev'));
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/auth', auth_1.default);
app.use('/api/contacts', contacts_1.default);
app.use('/api/guardian', guardian_1.default);
app.use('/api/locations', locations_1.default);
app.use('/api/universities', universities_1.default);
async function start() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not set');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');
        app.listen(port, () => {
            console.log(`Backend running on http://localhost:${port}`);
        });
    }
    catch (err) {
        console.error('Failed to start server', err);
        process.exit(1);
    }
}
start();
exports.default = app;
