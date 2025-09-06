// backend/routes/speech.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// Store uploads in "uploads/" folder
const upload = multer({ dest: "uploads/" });

// POST /api/speech-to-text
router.post("/", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        console.log("🎙️ Received file:", req.file);

        // Example: just fake a result for now
        // Later, connect to OpenAI Whisper API, Google Speech-to-Text, etc.
        const fakeText = "Hello, this is a test speech recognition result.";

        // Cleanup: delete file after processing
        fs.unlinkSync(req.file.path);

        res.json({ text: fakeText });
    } catch (error) {
        console.error("Speech-to-text error:", error);
        res.status(500).json({ error: "Speech-to-text failed" });
    }
});

export default router;
