// backend/routes/helpRoutes.js
import express from "express";
const router = express.Router();

router.post("/geofence/status", (req, res) => {
    const { latitude, longitude } = req.body;

    // Example: Check against campus center (replace with DB data)
    const campusCenter = { lat: 3.123, lng: 101.654, radius: 2 }; // 2km radius
    const distance = calculateDistance(latitude, longitude, campusCenter.lat, campusCenter.lng);

    let currentZone = "outside";
    if (distance <= campusCenter.radius) currentZone = "campus";
    else if (distance <= campusCenter.radius + 5) currentZone = "coverage";

    res.json({ currentZone, distanceFromCenter: distance });
});

router.post("/help/send", (req, res) => {
    const { latitude, longitude, message } = req.body;

    // Here you could save to DB, notify security, etc.
    console.log("Help request received:", { latitude, longitude, message });

    res.json({ success: true, message: "Help request sent successfully" });
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default router;
