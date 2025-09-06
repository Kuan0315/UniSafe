// controllers/safeRouteController.js
import SafeRoute from "../models/SafeRoute.js";
import User from "../models/User.js";

// Create a new safe route
export const createRoute = async (req, res) => {
    try {
        const {
            name,
            description,
            startLocation,
            endLocation,
            waypoints,
            routeType,
            safetyLevel,
            features,
            estimatedTime,
            distance,
        } = req.body;

        if (!name || !startLocation || !endLocation || !estimatedTime || !distance) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const routeData = {
            name,
            description,
            startLocation,
            endLocation,
            waypoints: waypoints || [],
            routeType: routeType || "walking",
            safetyLevel: safetyLevel || "safe",
            features: features || {},
            estimatedTime,
            distance,
            createdBy: req.user.id,
        };

        const safeRoute = await SafeRoute.create(routeData);

        res.status(201).json({
            success: true,
            route: {
                id: safeRoute._id,
                name: safeRoute.name,
                description: safeRoute.description,
                safetyLevel: safeRoute.safetyLevel,
                estimatedTime: safeRoute.estimatedTime,
                distance: safeRoute.distance,
                createdAt: safeRoute.createdAt,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Find safe routes between two points
export const findRoutes = async (req, res) => {
    try {
        const { startLat, startLng, endLat, endLng, routeType = "walking", maxDistance = 5000, limit = 5 } = req.query;

        if (!startLat || !startLng || !endLat || !endLng) {
            return res.status(400).json({ success: false, message: "Start and end coordinates are required" });
        }

        const routes = await SafeRoute.find({
            isActive: true,
            routeType,
            $and: [
                {
                    startLocation: {
                        $near: {
                            $geometry: { type: "Point", coordinates: [parseFloat(startLng), parseFloat(startLat)] },
                            $maxDistance: parseInt(maxDistance),
                        },
                    },
                },
                {
                    endLocation: {
                        $near: {
                            $geometry: { type: "Point", coordinates: [parseFloat(endLng), parseFloat(endLat)] },
                            $maxDistance: parseInt(maxDistance),
                        },
                    },
                },
            ],
        })
            .populate("createdBy", "name")
            .sort({ safetyLevel: 1, "rating.average": -1, estimatedTime: 1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            routes: routes.map(route => ({
                id: route._id,
                name: route.name,
                description: route.description,
                startLocation: route.startLocation,
                endLocation: route.endLocation,
                waypoints: route.waypoints,
                routeType: route.routeType,
                safetyLevel: route.safetyLevel,
                features: route.features,
                estimatedTime: route.estimatedTime,
                distance: route.distance,
                rating: route.rating,
                usageCount: route.usageCount,
                createdBy: route.createdBy?.name,
            })),
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get route details
export const getRouteDetails = async (req, res) => {
    try {
        const { routeId } = req.params;
        const route = await SafeRoute.findById(routeId).populate("createdBy", "name");

        if (!route) return res.status(404).json({ success: false, message: "Route not found" });

        route.usageCount += 1;
        await route.save();

        res.status(200).json({
            success: true,
            route: {
                id: route._id,
                name: route.name,
                description: route.description,
                startLocation: route.startLocation,
                endLocation: route.endLocation,
                waypoints: route.waypoints,
                routeType: route.routeType,
                safetyLevel: route.safetyLevel,
                features: route.features,
                estimatedTime: route.estimatedTime,
                distance: route.distance,
                rating: route.rating,
                usageCount: route.usageCount,
                createdBy: route.createdBy?.name,
                createdAt: route.createdAt,
                lastUpdated: route.lastUpdated,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Rate a route
export const rateRoute = async (req, res) => {
    try {
        const { routeId } = req.params;
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }

        const route = await SafeRoute.findById(routeId);
        if (!route) return res.status(404).json({ success: false, message: "Route not found" });

        const currentTotal = route.rating.average * route.rating.count;
        const newTotal = currentTotal + rating;
        const newCount = route.rating.count + 1;
        const newAverage = newTotal / newCount;

        route.rating = { average: Math.round(newAverage * 10) / 10, count: newCount };
        await route.save();

        res.status(200).json({ success: true, rating: route.rating });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get popular routes
export const getPopularRoutes = async (req, res) => {
    try {
        const { limit = 10, routeType } = req.query;
        const filter = { isActive: true };
        if (routeType) filter.routeType = routeType;

        const routes = await SafeRoute.find(filter)
            .sort({ usageCount: -1, "rating.average": -1 })
            .limit(parseInt(limit))
            .populate("createdBy", "name");

        res.status(200).json({
            success: true,
            routes: routes.map(route => ({
                id: route._id,
                name: route.name,
                description: route.description,
                routeType: route.routeType,
                safetyLevel: route.safetyLevel,
                estimatedTime: route.estimatedTime,
                distance: route.distance,
                rating: route.rating,
                usageCount: route.usageCount,
                createdBy: route.createdBy?.name,
            })),
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update route
export const updateRoute = async (req, res) => {
    try {
        const { routeId } = req.params;
        const updateData = req.body;

        const route = await SafeRoute.findById(routeId);
        if (!route) return res.status(404).json({ success: false, message: "Route not found" });

        const user = await User.findById(req.user.id);
        if (route.createdBy.toString() !== req.user.id && !["security", "staff"].includes(user.role)) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const allowedFields = ["name", "description", "waypoints", "safetyLevel", "features", "estimatedTime", "distance", "isActive"];
        allowedFields.forEach(field => { if (updateData[field] !== undefined) route[field] = updateData[field]; });

        route.lastUpdated = new Date();
        await route.save();

        res.status(200).json({
            success: true,
            route: {
                id: route._id,
                name: route.name,
                description: route.description,
                safetyLevel: route.safetyLevel,
                estimatedTime: route.estimatedTime,
                distance: route.distance,
                isActive: route.isActive,
                lastUpdated: route.lastUpdated,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get route statistics
export const getRouteStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!["security", "staff"].includes(user.role)) return res.status(403).json({ success: false, message: "Access denied" });

        const stats = await SafeRoute.aggregate([
            { $group: { _id: { routeType: "$routeType", safetyLevel: "$safetyLevel" }, count: { $sum: 1 }, avgRating: { $avg: "$rating.average" }, totalUsage: { $sum: "$usageCount" } } }
        ]);

        const totalRoutes = await SafeRoute.countDocuments({ isActive: true });
        const totalUsage = await SafeRoute.aggregate([{ $group: { _id: null, total: { $sum: "$usageCount" } } }]);

        res.status(200).json({
            success: true,
            stats,
            summary: { totalRoutes, totalUsage: totalUsage[0]?.total || 0 },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
