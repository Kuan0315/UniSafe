# Guardian Mode Notification System

This document describes the backend implementation for the Guardian Mode notification system that allows guardians to receive notifications when students start Guardian Mode and track their location.

## Overview

The system consists of:
- **Notification Model**: Stores notifications sent to guardians
- **Guardian Session Management**: Tracks active guardian mode sessions
- **Location Updates**: Real-time location tracking during guardian mode
- **API Endpoints**: RESTful endpoints for frontend integration

## Models

### Notification Model (`src/models/Notification.ts`)

Stores notifications sent to guardians with the following fields:
- `recipientId`: Guardian who receives the notification
- `senderId`: Student who started guardian mode
- `sessionId`: Reference to the guardian session
- `type`: Type of notification (guardian_mode_started, location_update, etc.)
- `title`: Notification title
- `message`: Notification message
- `location`: GPS coordinates and address
- `destination`: Student's destination
- `isRead`: Read status
- `data`: Additional data (route, estimated arrival, etc.)

### GuardianSession Model (`src/models/GuardianSession.ts`)

Tracks active guardian mode sessions:
- `userId`: Student using guardian mode
- `destination`: Where the student is going
- `isActive`: Whether the session is currently active
- `route`: Array of GPS coordinates
- `trustedContacts`: List of guardian contacts
- `checkInIntervalMinutes`: How often to check in

## API Endpoints

### Notifications (`/api/notifications`)

#### GET `/api/notifications`
- **Description**: Fetch all notifications for the authenticated user
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of notification objects

#### GET `/api/notifications/unread-count`
- **Description**: Get count of unread notifications
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ count: number }`

#### PATCH `/api/notifications/:id/read`
- **Description**: Mark a specific notification as read
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Updated notification object

#### PATCH `/api/notifications/mark-all-read`
- **Description**: Mark all notifications as read
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true }`

#### POST `/api/notifications`
- **Description**: Create a new notification (internal use)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Notification object
- **Response**: Created notification object

### Guardian Mode (`/api/guardian`)

#### GET `/api/guardian/active`
- **Description**: Get active guardian session for user
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Guardian session object or null

#### POST `/api/guardian/start`
- **Description**: Start a new guardian mode session
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "destination": "University Library",
    "estimatedArrival": "2024-01-01T12:00:00Z",
    "route": [{"latitude": 3.1203, "longitude": 101.6544}],
    "trustedContacts": ["contact_id_1", "contact_id_2"],
    "checkInIntervalMinutes": 5
  }
  ```
- **Response**: Created guardian session
- **Side Effect**: Automatically creates notifications for all trusted contacts

#### POST `/api/guardian/end`
- **Description**: End the current guardian mode session
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true }`

#### POST `/api/guardian/location`
- **Description**: Update location during guardian mode
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "latitude": 3.1203,
    "longitude": 101.6544,
    "address": "Current location"
  }
  ```
- **Response**: `{ success: true }`
- **Side Effect**: Automatically creates location update notifications for guardians

#### POST `/api/guardian/checkin`
- **Description**: Record a safety check-in
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true }`

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Notification Flow

1. **Student starts Guardian Mode**:
   - Student calls `POST /api/guardian/start`
   - System creates GuardianSession
   - System finds guardian users from trusted contacts
   - System creates notifications for each guardian
   - Guardians receive notifications with student's location and destination

2. **Location Updates**:
   - Student's app sends location updates via `POST /api/guardian/location`
   - System updates the session route
   - System creates location update notifications for guardians
   - Guardians receive real-time location updates

3. **Guardian Views Notifications**:
   - Guardian calls `GET /api/notifications` to fetch notifications
   - Guardian can mark notifications as read
   - Guardian can view location on Google Maps using coordinates

## Database Indexes

The system includes optimized indexes for:
- `notifications.recipientId` + `notifications.isRead` + `notifications.createdAt`
- `notifications.sessionId`
- `guardianSessions.userId` + `guardianSessions.isActive`

## Testing

Run the test script to verify all endpoints:
```bash
cd backend
node test-notifications.js
```

Make sure the backend server is running on `http://localhost:4000` before running tests.

## Error Handling

All endpoints include proper error handling:
- 400: Bad Request (invalid data)
- 401: Unauthorized (missing/invalid token)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

## Security Considerations

- All endpoints require authentication
- User can only access their own notifications
- Guardian sessions are tied to authenticated users
- Location data is only shared with trusted contacts

## Future Enhancements

- Push notifications via Expo/APNS
- Real-time updates via WebSocket
- Geofencing for automatic check-ins
- Emergency alerts and SOS integration
- Location history and analytics
