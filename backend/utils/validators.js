// utils/validators.js

export const validateSignup = (data) => {
    if (!data.email || !data.password) {
        throw new Error("Email and password are required");
    }
    return true;
};

export const validateLogin = (data) => {
    if (!data.email || !data.password) {
        throw new Error("Email and password are required");
    }
    return true;
};

export const validateTrip = (data) => {
    if (!data.destination || !data.startTime || !data.endTime) {
        throw new Error("Destination, start time, and end time are required");
    }
    return true;
};

export const validateCheckin = (data) => {
    if (!data.tripId || !data.userId) {
        throw new Error("Trip ID and User ID are required");
    }
    return true;
};

export const validateFlashlightSession = (data) => {
    if (!data.duration || !data.intensity) {
        throw new Error("Duration and intensity are required");
    }
    return true;
};

export const validateFollowMeSession = (data) => {
    if (!data.latitude || !data.longitude) {
        throw new Error("Latitude and longitude are required");
    }
    return true;
};

export const validateGuardianSession = (data) => {
    if (!data.userId || !data.destination || !data.eta) {
        throw new Error("User ID, destination, and ETA are required");
    }
    return true;
};

export const validateNotification = (data) => {
    if (!data.type || !data.message) {
        throw new Error("Notification type and message are required");
    }
    return true;
};

export const validateEmergencyContact = (data) => {
    if (!data.name || !data.phone) {
        throw new Error("Contact name and phone number are required");
    }
    return true;
};

export const validateSafeRoute = (data) => {
    if (!data.startLocation || !data.endLocation) {
        throw new Error("Start and end locations are required");
    }
    return true;
};

export const validateIncidentReport = (data) => {
    if (!data.type || !data.description || !data.location) {
        throw new Error("Incident type, description, and location are required");
    }
    return true;
};

export const validateUserProfile = (data) => {
    if (!data.name || !data.email) {
        throw new Error("Name and email are required");
    }
    return true;
};

export const validatePasswordReset = (data) => {
    if (!data.email) {
        throw new Error("Email is required");
    }
    return true;
};

export const validateFeedback = (data) => {
    if (!data.message) {
        throw new Error("Feedback message is required");
    }
    return true;
};

export const validateLocationUpdate = (data) => {
    if (!data.latitude || !data.longitude) {
        throw new Error("Latitude and longitude are required");
    }
    return true;
};

export const validateSessionId = (data) => {
    if (!data.sessionId) {
        throw new Error("Session ID is required");
    }
    return true;
};

export const validateContactId = (data) => {
    if (!data.contactId) {
        throw new Error("Contact ID is required");
    }
    return true;
};

export const validateRouteId = (data) => {
    if (!data.routeId) {
        throw new Error("Route ID is required");
    }
    return true;
};

export const validateReportId = (data) => {
    if (!data.reportId) {
        throw new Error("Report ID is required");
    }
    return true;
};

export const validateTripId = (data) => {
    if (!data.tripId) {
        throw new Error("Trip ID is required");
    }
    return true;
};

export const validateUserId = (data) => {
    if (!data.userId) {
        throw new Error("User ID is required");
    }
    return true;
};

export const validateEmergencyId = (data) => {
    if (!data.emergencyId) {
        throw new Error("Emergency ID is required");
    }
    return true;
};

export const validateTimestamp = (data) => {
    if (!data.timestamp) {
        throw new Error("Timestamp is required");
    }
    return true;
};

export const validateCoordinates = (data) => {
    if (!data.latitude || !data.longitude) {
        throw new Error("Latitude and longitude are required");
    }
    return true;
};

export const validateAddress = (data) => {
    if (!data.address) {
        throw new Error("Address is required");
    }
    return true;
};

export const validateDuration = (data) => {
    if (!data.duration) {
        throw new Error("Duration is required");
    }
    return true;
};

export const validateIntensity = (data) => {
    if (!data.intensity) {
        throw new Error("Intensity is required");
    }
    return true;
};

export const validatePattern = (data) => {
    if (!data.pattern) {
        throw new Error("Pattern is required");
    }
    return true;
};

export const validateIsActive = (data) => {
    if (data.isActive === undefined) {
        throw new Error("isActive status is required");
    }
    return true;
};

export const validateExpiresAt = (data) => {
    if (!data.expiresAt) {
        throw new Error("Expiration time is required");
    }
    return true;
};

export const validateSharingWith = (data) => {
    if (!data.sharingWith || !Array.isArray(data.sharingWith)) {
        throw new Error("Sharing with list is required and must be an array");
    }
    return true;
};

export const validateLocationHistory = (data) => {
    if (!data.locationHistory || !Array.isArray(data.locationHistory)) {
        throw new Error("Location history is required and must be an array");
    }
    return true;
};

export const validateBatteryLevel = (data) => {
    if (data.batteryLevel === undefined) {
        throw new Error("Battery level is required");
    }
    return true;
};

export const validateIsEmergency = (data) => {
    if (data.isEmergency === undefined) {
        throw new Error("isEmergency status is required");
    }
    return true;
};

export const validateCustomPattern = (data) => {
    if (data.pattern === 'custom' && (!data.customPattern || !data.customPattern.onDuration || !data.customPattern.offDuration || !data.customPattern.repeat)) {
        throw new Error("Custom pattern details are required for custom pattern");
    }
    return true;
};

export const validateStatus = (data) => {
    if (!data.status) {
        throw new Error("Status is required");
    }
    return true;
};

export const validateStartTime = (data) => {
    if (!data.startTime) {
        throw new Error("Start time is required");
    }
    return true;
};

export const validateEndTime = (data) => {
    if (!data.endTime) {
        throw new Error("End time is required");
    }
    return true;
};

export const validateNextCheckIn = (data) => {
    if (!data.nextCheckIn) {
        throw new Error("Next check-in time is required");
    }
    return true;
};

export const validateProgress = (data) => {
    if (data.progress === undefined) {
        throw new Error("Progress is required");
    }
    return true;
};

export const validateTrustedContacts = (data) => {
    if (!data.trustedContacts || !Array.isArray(data.trustedContacts)) {
        throw new Error("Trusted contacts list is required and must be an array");
    }
    return true;
};

export const validateSharingList = (data) => {
    if (!data.sharingList || !Array.isArray(data.sharingList)) {
        throw new Error("Sharing list is required and must be an array");
    }
    return true;
};

// Email validation (basic regex)
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password validation (min 8 chars, at least 1 letter and 1 number)
export const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
};
