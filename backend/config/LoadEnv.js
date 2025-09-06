// backend/config/loadEnv.js
import dotenv from "dotenv";
import path from "path";

// Always load the .env from the current working dir (backend/)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Optional: quick sanity log (no secrets)
console.log("[ENV] host=%s user=%s db=%s hasPass=%s",
    process.env.MYSQL_HOST,
    process.env.MYSQL_USER,
    process.env.MYSQL_DB,
    Boolean(process.env.MYSQL_PASSWORD)
);
