// services/mapService.js

// Existing getMapData function
export const getMapData = async (latitude, longitude) => {
    return {
        location: { latitude, longitude },
        safetyLevel: "safe", // could be "safe", "medium", "danger"
        message: "This is mock map data. Replace with real API logic."
    };
};

// New calculateRoute function
export const calculateRoute = async (startLocation, endLocation) => {
    // Dummy implementation for now
    // Replace with real routing API logic if needed
    return {
        start: startLocation,
        end: endLocation,
        distance: "5 km",
        estimatedTime: "10 mins",
        route: [
            { latitude: startLocation.latitude, longitude: startLocation.longitude },
            { latitude: endLocation.latitude, longitude: endLocation.longitude }
        ],
        safetyLevel: "safe"
    };
};
