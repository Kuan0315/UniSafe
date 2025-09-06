// backend/routes/status.js
import express from "express";
const router = express.Router();

router.get("/status", (req, res) => {
    // Example: check DB, services, etc.
    res.json({
        ok: true,
        message: "Backend is running 🚀",
        timestamp: new Date(),
    });
});

export default router;
