import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        const url = "https://www.googleapis.com/customsearch/v1";
        const response = await axios.get(url, {
            params: {
                key: process.env.GOOGLE_API_KEY,
                cx: process.env.GOOGLE_CSE_ID,
                q: message,
                num: 3,
                safe: "active",
            }
        });

        const items = response.data.items || [];
        if (!items.length) return res.json({ reply: "I couldn't find any results." });

        const snippets = items.map(item => item.snippet).join(" ");
        const reply = `Here’s a quick summary I found: ${snippets} (I also have sources if you want).`;

        res.json({
            reply,
            sources: items.map(item => ({ title: item.title, link: item.link }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong with the chatbot." });
    }
});

export default router;
