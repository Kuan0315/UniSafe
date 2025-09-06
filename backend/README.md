# UniSave Backend - Campus Safety App

This is the backend server for the UniSave campus safety application, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication with Email Verification**
- **JWT-based Security**
- **Role-based Access Control** (Student, Staff, Teacher, Security)
- **Real-time Communication** with Socket.IO
- **Email Service Integration**
- **MongoDB Database**
- **RESTful API Design**

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- SMTP email service (Gmail, SendGrid, etc.)

## 🛠️ Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd campus-safety-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # Copy the template
   cp env-template.txt .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Configure environment variables:**
   ```env
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/campus-safety
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   
   # Email Configuration (Gmail example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
   ```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:5000`

## 🧪 Testing

### Test Backend Connection
```bash
npm run test-connection
```

### Test Email Service
```bash
npm run test-email
```

### Test Frontend-Backend Connection
Open `test-frontend.html` in your browser to test the API endpoints.

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email/:token` - Email verification
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### User Management
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/privacy` - Update privacy settings
- `PUT /api/auth/preferences` - Update app preferences
- `POST /api/auth/trusted-circle` - Manage trusted circle
- `POST /api/auth/emergency-contacts` - Manage emergency contacts

### SOS & Safety
- `POST /api/sos/alert` - Create SOS alert
- `GET /api/sos/mine` - Get user's alerts
- `PATCH /api/sos/:id/resolve` - Resolve alert

## 🔐 Email Verification Flow

1. **User Registration**: Account created with `isVerified: false`
2. **Verification Email**: Sent automatically with verification link
3. **Email Verification**: User clicks link to verify account
4. **Account Activation**: Verified users can now log in

## 🌐 CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (React development)
- `http://localhost:19006` (Expo development)

## 📱 Frontend Integration

The backend is designed to work with React Native/Expo frontend applications. The API endpoints return JSON responses with consistent structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "user": { /* user data */ },
  "token": "jwt-token-here"
}
```

## 🔧 Common Issues & Solutions

### 1. MongoDB Connection Failed
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env`
- Verify network connectivity

### 2. Email Not Sending
- Check SMTP configuration in `.env`
- For Gmail, use App Password (not regular password)
- Verify firewall/network settings

### 3. JWT Errors
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiration settings

### 4. CORS Issues
- Verify `ALLOWED_ORIGINS` in `.env`
- Check frontend URL matches allowed origins

## 🚀 Deployment

### Environment Variables
Set production environment variables:
```env
NODE_ENV=production
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
EMAIL_HOST=your-production-smtp-host
EMAIL_USER=your-production-email
EMAIL_PASS=your-production-email-password
```

### Process Management
Use PM2 or similar process manager:
```bash
npm install -g pm2
pm2 start server.js --name "unisave-backend"
pm2 startup
pm2 save
```

## 📚 API Documentation

For detailed API documentation, see the individual route files in the `routes/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.
