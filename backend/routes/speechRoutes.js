import express from "express";
import multer from "multer";
import axios from "axios";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Example using OpenAI Whisper (you can switch to Google if needed)
router.post("/speech-to-text", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        // Send audio to OpenAI Whisper API
        const response = await axios.post(
            "https://api.openai.com/v1/audio/transcriptions",
            req.file.buffer,
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "audio/wav" // or mp3 depending on recording format
                },
                params: {
                    model: "whisper-1"
                }
            }
        );

        res.json({ text: response.data.text });
    } catch (error) {
        console.error("Speech-to-Text error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to transcribe audio" });
    }
});

export default router;
