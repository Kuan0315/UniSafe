import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { MALAYSIAN_UNIVERSITIES, UniversityRecord } from './malaysian_universities';

export interface University {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  campusBoundary: Array<{
    latitude: number;
    longitude: number;
  }>;
  coverageRadius: number; // in kilometers
}

export interface GeofenceStatus {
  isWithinCoverage: boolean;
  isWithinCampus: boolean;
  distanceFromCenter: number; // in kilometers
  nearestBoundaryDistance: number; // in kilometers
  currentZone: 'campus' | 'coverage' | 'outside';
}

export interface HelpMessage {
  id: string;
  message: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  recipient: 'security' | 'emergency_contact';
  status: 'pending' | 'sent' | 'delivered';
}

export class GeofencingService {
  private universities: University[] = [];
  private currentUniversity: University | null = null;
  private userHelpMessage: string = "I need immediate assistance. Please help me.";
  private emergencyContacts: Array<{
    id: string;
    name: string;
    phone: string;
    relationship: string;
    callFrequency: number;
    lastCallDate: Date;
  }> = [];

  constructor() {
    this.initializeUniversities();
    this.initializeEmergencyContacts();
  }

  private initializeUniversities() {
    // Load from dataset to allow scaling to all Malaysian universities
    this.universities = MALAYSIAN_UNIVERSITIES.map((u: UniversityRecord) => ({
      id: u.id,
      name: u.name,
      center: u.center,
      campusBoundary: u.campusBoundary,
      coverageRadius: u.coverageRadius,
    }));
  }

  private initializeEmergencyContacts() {
    // Default emergency contacts
    this.emergencyContacts = [
      {
        id: '1',
        name: 'Mom',
        phone: '+1234567890',
        relationship: 'Parent',
        callFrequency: 5,
        lastCallDate: new Date()
      },
      {
        id: '2',
        name: 'Dad',
        phone: '+1234567891',
        relationship: 'Parent',
        callFrequency: 3,
        lastCallDate: new Date()
      },
      {
        id: '3',
        name: 'Roommate',
        phone: '+1234567892',
        relationship: 'Roommate',
        callFrequency: 8,
        lastCallDate: new Date()
      }
    ];
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Check if a point is inside a polygon (campus boundary)
  private isPointInPolygon(
    point: { latitude: number; longitude: number },
    polygon: Array<{ latitude: number; longitude: number }>
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        ((polygon[i].latitude > point.latitude) !== (polygon[j].latitude > point.latitude)) &&
        (point.longitude < (polygon[j].longitude - polygon[i].longitude) * (point.latitude - polygon[i].latitude) / (polygon[j].latitude - polygon[i].latitude) + polygon[i].longitude)
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  // Get current geofence status
  async getGeofenceStatus(userLocation: Location.LocationObject): Promise<GeofenceStatus> {
    if (!this.currentUniversity) {
      return {
        isWithinCoverage: false,
        isWithinCampus: false,
        distanceFromCenter: Infinity,
        nearestBoundaryDistance: Infinity,
        currentZone: 'outside'
      };
    }

    const userLat = userLocation.coords.latitude;
    const userLng = userLocation.coords.longitude;

    // Calculate distance from university center
    const distanceFromCenter = this.calculateDistance(
      userLat,
      userLng,
      this.currentUniversity.center.latitude,
      this.currentUniversity.center.longitude
    );

    // Check if within coverage radius
    const isWithinCoverage = distanceFromCenter <= this.currentUniversity.coverageRadius;

    // Check if within campus boundary
    const isWithinCampus = this.isPointInPolygon(
      { latitude: userLat, longitude: userLng },
      this.currentUniversity.campusBoundary
    );

    // Determine current zone
    let currentZone: 'campus' | 'coverage' | 'outside';
    if (isWithinCampus) {
      currentZone = 'campus';
    } else if (isWithinCoverage) {
      currentZone = 'coverage';
    } else {
      currentZone = 'outside';
    }

    return {
      isWithinCoverage,
      isWithinCampus,
      distanceFromCenter,
      nearestBoundaryDistance: distanceFromCenter,
      currentZone
    };
  }

  // Set university for geofencing
  setUniversity(universityId: string): boolean {
    const university = this.universities.find(u => u.id === universityId);
    if (university) {
      this.currentUniversity = university;
      return true;
    }
    return false;
  }

  // Get available universities
  getAvailableUniversities(): University[] {
    return this.universities;
  }

  // Get current university
  getCurrentUniversity(): University | null {
    return this.currentUniversity;
  }

  // Set custom help message
  setHelpMessage(message: string): void {
    this.userHelpMessage = message;
  }

  // Get current help message
  getHelpMessage(): string {
    return this.userHelpMessage;
  }

  // Add emergency contact
  addEmergencyContact(contact: {
    name: string;
    phone: string;
    relationship: string;
  }): void {
    const newContact = {
      id: Date.now().toString(),
      ...contact,
      callFrequency: 0,
      lastCallDate: new Date()
    };
    this.emergencyContacts.push(newContact);
  }

  // Get emergency contacts sorted by frequency and recency
  getEmergencyContacts(): Array<{
    id: string;
    name: string;
    phone: string;
    relationship: string;
    callFrequency: number;
    lastCallDate: Date;
  }> {
    return [...this.emergencyContacts].sort((a, b) => {
      // Sort by call frequency first, then by recency
      if (a.callFrequency !== b.callFrequency) {
        return b.callFrequency - a.callFrequency;
      }
      return b.lastCallDate.getTime() - a.lastCallDate.getTime();
    });
  }

  // Send help message based on current location
  async sendHelpMessage(userLocation: Location.LocationObject): Promise<HelpMessage> {
    const geofenceStatus = await this.getGeofenceStatus(userLocation);
    
    let recipient: 'security' | 'emergency_contact';
    let message: string;

    if (geofenceStatus.currentZone === 'outside') {
      throw new Error('You are outside the coverage area. This app only works within campus and nearby areas.');
    }

    if (geofenceStatus.currentZone === 'campus') {
      recipient = 'security';
      message = `CAMPUS EMERGENCY: ${this.userHelpMessage}\nLocation: ${userLocation.coords.latitude}, ${userLocation.coords.longitude}\nTime: ${new Date().toLocaleString()}`;
    } else {
      recipient = 'emergency_contact';
      const topContact = this.getEmergencyContacts()[0];
      message = `EMERGENCY: ${this.userHelpMessage}\nLocation: ${userLocation.coords.latitude}, ${userLocation.coords.longitude}\nTime: ${new Date().toLocaleString()}\nContact: ${topContact.name} (${topContact.phone})`;
    }

    const helpMessage: HelpMessage = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      location: {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude
      },
      recipient,
      status: 'pending'
    };

    // Simulate sending the message
    await this.sendMessage(helpMessage);

    return helpMessage;
  }

  // Simulate sending message (in real app, this would integrate with SMS/email services)
  private async sendMessage(helpMessage: HelpMessage): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (helpMessage.recipient === 'security') {
      Alert.alert(
        'Help Message Sent',
        `Message sent to campus security office.\n\nMessage: ${helpMessage.message}`,
        [{ text: 'OK' }]
      );
    } else {
      const topContact = this.getEmergencyContacts()[0];
      Alert.alert(
        'Help Message Sent',
        `Message sent to emergency contact: ${topContact.name}\n\nMessage: ${helpMessage.message}`,
        [{ text: 'OK' }]
      );
    }

    helpMessage.status = 'sent';
  }

  // Update call frequency for emergency contacts
  updateCallFrequency(contactId: string): void {
    const contact = this.emergencyContacts.find(c => c.id === contactId);
    if (contact) {
      contact.callFrequency++;
      contact.lastCallDate = new Date();
    }
  }
}

export default new GeofencingService();
