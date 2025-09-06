// config.js
const config = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // MySQL configuration moved to database.js

    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',

    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
    EMAIL_USER: process.env.EMAIL_USER || 'your-email@gmail.com',
    EMAIL_PASS: process.env.EMAIL_PASS || 'your-app-password',
    EMAIL_NAME: process.env.EMAIL_NAME || 'Campus Safety',

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'your-twilio-account-sid',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'your-twilio-auth-token',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || 'your-twilio-phone-number',

    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || 'AIzaSyBClh6OLOiyM0zKKQ7hcwXbqlUqyMX0T30',
    GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID || 'your-google-cse-id',

    MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB ? Number(process.env.MAX_UPLOAD_MB) : 25,

    BASE_URL: process.env.BASE_URL || 'http://localhost:5000',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5000',
    MYSQL_HOST: process.env.MYSQL_HOST || ",
    MYSQL_USER: process.env.MYSQL_USER || "root",
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
    MYSQL_DB: process.env.MYSQL_DB || "campus_safety",
    MYSQL_PORT: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,

};

export default config;
