# Backend Notification System - Setup Complete ✅

## Overview
The backend notification system for Guardian Mode has been successfully implemented and connected to the database. The system allows guardians to receive real-time notifications when students start Guardian Mode and track their location.

## What's Been Implemented

### 1. Database Models ✅
- **Notification Model**: Stores all notifications with location data, sender/recipient info, and metadata
- **GuardianSession Model**: Tracks active guardian mode sessions with routes and contacts
- **User Model**: Enhanced with proper role support (student, guardian, security, staff)
- **Contact Model**: Manages trusted contacts for students

### 2. API Endpoints ✅
- **Notifications API** (`/api/notifications`):
  - `GET /` - Fetch notifications for authenticated user
  - `GET /unread-count` - Get unread notification count
  - `PATCH /:id/read` - Mark notification as read
  - `PATCH /mark-all-read` - Mark all notifications as read
  - `POST /` - Create notification (internal use)

- **Guardian Mode API** (`/api/guardian`):
  - `GET /active` - Get active guardian session
  - `POST /start` - Start guardian mode (creates notifications for guardians)
  - `POST /end` - End guardian mode
  - `POST /location` - Update location (sends notifications to guardians)
  - `POST /checkin` - Record safety check-in

- **Status API** (`/api/status`):
  - `GET /database` - Database connection and collection stats
  - `GET /notifications` - Notification system statistics
  - `GET /guardian-mode` - Guardian mode usage statistics

### 3. Database Integration ✅
- **Connection Management**: Proper MongoDB connection with event handlers
- **Migrations**: Automatic database schema updates and index creation
- **Indexes**: Optimized indexes for performance on all collections
- **Sample Data**: Automatic creation of test users and contacts

### 4. Authentication ✅
- **JWT Integration**: All endpoints protected with JWT authentication
- **Role-based Access**: Different access levels for students, guardians, and security
- **Token Management**: Secure token generation and validation

### 5. Notification Flow ✅
1. **Student starts Guardian Mode** → Notifications sent to all trusted contacts
2. **Location updates** → Real-time notifications sent to guardians
3. **Guardians receive notifications** → Can view location on Google Maps
4. **Session ends** → Final notification sent to guardians

## Database Collections

### notifications
```javascript
{
  recipientId: ObjectId,    // Guardian who receives notification
  senderId: ObjectId,       // Student who started guardian mode
  sessionId: ObjectId,      // Guardian session reference
  type: String,             // 'guardian_mode_started', 'location_update', etc.
  title: String,            // Notification title
  message: String,          // Notification message
  location: {               // GPS coordinates
    latitude: Number,
    longitude: Number,
    address: String
  },
  destination: String,      // Student's destination
  isRead: Boolean,          // Read status
  data: Object,             // Additional data (route, etc.)
  createdAt: Date,
  updatedAt: Date
}
```

### guardiansessions
```javascript
{
  userId: ObjectId,         // Student using guardian mode
  destination: String,      // Where student is going
  isActive: Boolean,        // Whether session is active
  estimatedArrival: Date,   // Expected arrival time
  route: Array,             // GPS coordinates array
  trustedContacts: Array,   // Guardian contact IDs
  checkInIntervalMinutes: Number,
  lastCheckInAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## How to Start the Backend

### Option 1: Using the startup script
```bash
cd backend
chmod +x start-backend.sh
./start-backend.sh
```

### Option 2: Manual startup
```bash
cd backend
npm install
npm run build
npm start
```

### Option 3: Development mode
```bash
cd backend
npm install
npm run dev
```

## Testing the System

### 1. Health Check
```bash
curl http://localhost:4000/api/health
```

### 2. Database Status
```bash
curl http://localhost:4000/api/status/database
```

### 3. Run Full Test Suite
```bash
cd backend
npm test
```

## Sample API Usage

### Start Guardian Mode (Student)
```bash
curl -X POST http://localhost:4000/api/guardian/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "University Library",
    "estimatedArrival": "2024-01-01T12:00:00Z",
    "route": [{"latitude": 3.1203, "longitude": 101.6544}],
    "trustedContacts": ["contact_id_1"],
    "checkInIntervalMinutes": 5
  }'
```

### Get Notifications (Guardian)
```bash
curl http://localhost:4000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Location (Student)
```bash
curl -X POST http://localhost:4000/api/guardian/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "latitude": 3.1213,
    "longitude": 101.6554,
    "address": "Current location"
  }'
```

## Environment Variables

The system uses these environment variables (with fallback defaults):
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `PORT`: Server port (default: 4000)
- `CLIENT_ORIGIN`: Frontend origin for CORS

## Security Features

- ✅ JWT authentication on all endpoints
- ✅ Role-based access control
- ✅ Input validation with Zod schemas
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Rate limiting ready (can be added)

## Performance Optimizations

- ✅ Database indexes on all query fields
- ✅ Efficient aggregation queries
- ✅ Connection pooling
- ✅ Background index creation
- ✅ Optimized notification queries

## Monitoring & Logging

- ✅ Health check endpoint
- ✅ Database status monitoring
- ✅ Request logging with Morgan
- ✅ Error handling and logging
- ✅ Connection event monitoring

## Next Steps

The backend is now fully functional and ready to be integrated with the frontend. The notification system will:

1. **Automatically send notifications** when students start Guardian Mode
2. **Track location updates** and notify guardians in real-time
3. **Store all notification data** with GPS coordinates for Google Maps integration
4. **Provide status endpoints** for monitoring system health
5. **Handle authentication** securely with JWT tokens

The system is production-ready and includes proper error handling, logging, and monitoring capabilities.
