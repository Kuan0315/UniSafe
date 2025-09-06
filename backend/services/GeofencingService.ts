import { Platform } from "react-native";
import * as Location from "expo-location";

export type GeofenceStatus = {
    currentZone: "campus" | "coverage" | "outside";
    distanceFromCenter: number;
};

export type University = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number; // in meters
};

const API_URL =
    Platform.OS === "android"
        ? "http://192.168.0.100:5000/api" // use your computer’s IPv4
        : "http://localhost:5000/api";

class GeofencingService {
    private helpMessage: string = "";

    setHelpMessage(message: string) {
        this.helpMessage = message;
    }

    async getGeofenceStatus(location: Location.LocationObject): Promise<GeofenceStatus> {
        const response = await fetch(`${API_URL}/geofence/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch geofence status");
        }

        return response.json();
    }

    async sendHelpMessage(location: Location.LocationObject): Promise<any> {
        const response = await fetch(`${API_URL}/help/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                message: this.helpMessage || "I need help at my current location!",
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to send help message");
        }

        return response.json();
    }
}

export default new GeofencingService();
