import express from "express";

const router = express.Router();

// In real apps, fetch from DB
const universities = [
    {
        id: "um",
        name: "University of Malaya (UM)",
        center: { latitude: 3.1200, longitude: 101.6544 },
    },
    {
        id: "mmu",
        name: "Multimedia University (MMU)",
        center: { latitude: 2.9285, longitude: 101.6417 },
    },
    {
        id: "ukm",
        name: "Universiti Kebangsaan Malaysia (UKM)",
        center: { latitude: 2.9225, longitude: 101.7872 },
    },
];

let currentUniversity = null; // for demo (later, per-user in DB)

// 📌 Get available universities
router.get("/universities", (req, res) => {
    res.json(universities);
});

// 📌 Set selected university
router.post("/universities/:id", (req, res) => {
    const id = req.params.id;
    const uni = universities.find((u) => u.id === id);
    if (!uni) {
        return res.status(404).json({ error: "University not found" });
    }
    currentUniversity = uni;
    res.json({ success: true, university: uni });
});

// 📌 Get current university
router.get("/universities/current", (req, res) => {
    if (!currentUniversity) {
        return res.json({ university: null });
    }
    res.json({ university: currentUniversity });
});

export default router;
