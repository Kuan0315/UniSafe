// utils/routeSafetyUpdater.js
import SafeRoute from '../models/SafeRoute.js';
import Report from '../models/Report.js'; // assuming you have a report model

/**
 * Update safety level of routes based on reported incidents.
 * For simplicity, safety score is reduced by the number of nearby reports.
 */
export const updateRouteSafety = async (report) => {
    try {
        const { latitude, longitude, severity } = report;

        // Find all active routes within 500m of the report
        const routes = await SafeRoute.find({
            isActive: true,
            $or: [
                {
                    startLocation: {
                        $near: {
                            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                            $maxDistance: 500
                        }
                    }
                },
                {
                    endLocation: {
                        $near: {
                            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                            $maxDistance: 500
                        }
                    }
                }
            ]
        });

        for (const route of routes) {
            // Simple scoring: higher severity lowers safety
            let newSafety;
            switch (severity) {
                case 'high': newSafety = 'avoid'; break;
                case 'medium': newSafety = 'moderate'; break;
                case 'low': newSafety = 'safe'; break;
                default: newSafety = route.safetyLevel; break;
            }
            route.safetyLevel = newSafety;
            await route.save();
        }

        console.log(`✅ Updated ${routes.length} route(s) safety based on new report`);
    } catch (err) {
        console.error('Error updating route safety:', err);
    }
};
