// backend/config/db.js
import mysql from "mysql2";
import dotenv from "dotenv";
import "./loadEnv.js"; // safe to import again; config() is idempotent

dotenv.config(); // Load .env variables

// Create MySQL connection
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DB || "",   // make sure this matches your .env
    port: process.env.MYSQL_PORT || 3306,
    multipleStatements: false,
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error("❌ DB connect error:", err.code, err.message);
        console.error("   Using => host=%s user=%s db=%s",
            process.env.MYSQL_HOST, process.env.MYSQL_USER, process.env.MYSQL_DB);
        process.exit(1);
    } else {
        console.log("✅ DB connected: %s@%s/%s",
            process.env.MYSQL_USER, process.env.MYSQL_HOST, process.env.MYSQL_DB);
    }
});

export default connection;
