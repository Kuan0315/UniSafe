# Frontend Integration Guide

This guide explains how to connect your frontend application with the Campus Safety Backend API.

## Backend Configuration

The backend is configured to run on **port 5000** and accepts connections from frontend running on **port 3000**.

### CORS Configuration

The backend is configured with CORS to allow requests from:
- `http://localhost:3000` (Development)
- `http://localhost:3001` (Alternative development port)
- Your production domain (when deployed)

## API Base URL

All API endpoints are prefixed with:
```
http://localhost:5000/api
```

## Authentication Flow

### 1. User Registration

```javascript
// Frontend: Register user
const registerUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        role: userData.role
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // User registered successfully
      // Show message: "Please check your email to verify your account"
      return { success: true, message: 'Registration successful. Please check your email.' };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Registration failed. Please try again.' };
  }
};
```

### 2. Email Verification

The backend sends verification emails with links to your frontend. The frontend should handle the verification route:

```javascript
// Frontend: Handle email verification
const verifyEmail = async (token) => {
  try {
    const response = await fetch(`http://localhost:5000/api/auth/verify-email/${token}`, {
      method: 'GET'
    });

    const data = await response.json();
    
    if (data.success) {
      // Email verified successfully
      // Redirect to login page or show success message
      return { success: true, message: 'Email verified successfully!' };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Verification failed. Please try again.' };
  }
};
```

### 3. User Login

```javascript
// Frontend: Login user
const loginUser = async (credentials) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Store JWT token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return { success: true, user: data.user };
    } else {
      if (data.requiresVerification) {
        return { 
          success: false, 
          requiresVerification: true, 
          message: data.message 
        };
      }
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Login failed. Please try again.' };
  }
};
```

### 4. Resend Verification Email

```javascript
// Frontend: Resend verification email
const resendVerification = async (email) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to resend verification email.' };
  }
};
```

## Protected Routes

For protected routes, include the JWT token in the Authorization header:

```javascript
// Frontend: Make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/login';
    return;
  }

  return response;
};
```

## Location Services

### Update User Location

```javascript
// Frontend: Update user location
const updateLocation = async (latitude, longitude, accuracy = null) => {
  try {
    const response = await makeAuthenticatedRequest(
      'http://localhost:5000/api/location/update',
      {
        method: 'POST',
        body: JSON.stringify({ lat: latitude, lng: longitude, accuracy })
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to update location.' };
  }
};
```

### Start Location Sharing

```javascript
// Frontend: Start location sharing
const startLocationSharing = async (expiresMinutes = null) => {
  try {
    const response = await makeAuthenticatedRequest(
      'http://localhost:5000/api/location/live-share/start',
      {
        method: 'POST',
        body: JSON.stringify({ expiresMinutes })
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to start location sharing.' };
  }
};
```

### Get Directions

```javascript
// Frontend: Get directions between two points
const getDirections = async (origin, destination, mode = 'walking') => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/location/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}`
    );

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to get directions.' };
  }
};
```

## Real-time Features

### Socket.IO Connection

```javascript
// Frontend: Connect to Socket.IO
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join user's personal room
socket.emit('join-user', userId);

// Listen for Follow Me updates
socket.on('followMeUpdate', (data) => {
  console.log('Follow Me update:', data);
  // Update UI with new location
});

// Listen for SOS alerts
socket.on('sosAlert', (data) => {
  console.log('SOS Alert:', data);
  // Show emergency notification
});

// Listen for safety alerts
socket.on('safetyAlert', (data) => {
  console.log('Safety Alert:', data);
  // Show safety notification
});
```

## Error Handling

The backend returns consistent error responses:

```javascript
// Frontend: Handle API errors
const handleApiError = (error) => {
  if (error.response) {
    const data = error.response.data;
    
    switch (error.response.status) {
      case 400:
        return `Bad Request: ${data.message}`;
      case 401:
        return `Unauthorized: ${data.message}`;
      case 403:
        return `Forbidden: ${data.message}`;
      case 404:
        return `Not Found: ${data.message}`;
      case 500:
        return `Server Error: ${data.message}`;
      default:
        return data.message || 'An error occurred';
    }
  }
  
  return 'Network error. Please check your connection.';
};
```

## Frontend Routes

Your frontend should include these routes to handle the backend integration:

```javascript
// React Router example
const routes = [
  {
    path: '/verify-email/:token',
    element: <EmailVerification />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>
  }
];
```

## Environment Variables

Create a `.env` file in your frontend project:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Testing the Connection

1. **Start the backend**: `npm run dev` (runs on port 5000)
2. **Start your frontend**: `npm start` (runs on port 3000)
3. **Test registration**: Try to register a new user
4. **Check email**: Verify the verification email is sent
5. **Test verification**: Click the verification link
6. **Test login**: Try to log in with verified credentials

## Troubleshooting

### Common Issues

1. **CORS Error**: Ensure backend CORS_ORIGIN includes your frontend URL
2. **Connection Refused**: Check if backend is running on port 5000
3. **Authentication Failed**: Verify JWT token is being sent correctly
4. **Email Not Sent**: Check email configuration in backend .env file

### Debug Steps

1. Check browser console for errors
2. Verify backend server is running
3. Check MySQL connection
4. Verify environment variables
5. Check email service configuration

## Security Notes

- Never expose JWT tokens in client-side code
- Use HTTPS in production
- Implement proper token refresh mechanism
- Validate all user inputs
- Implement rate limiting on frontend

## Next Steps

1. Implement the authentication flow
2. Add protected routes
3. Integrate location services
4. Add real-time features
5. Test all endpoints
6. Deploy to production
