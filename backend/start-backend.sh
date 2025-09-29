#!/bin/bash

# UniSafe Backend Startup Script
echo "🚀 Starting UniSafe Backend Server..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating one with default values..."
    cat > .env << EOF
MONGO_URI=mongodb+srv://unisafe:unisafestrongpass1234@cluster0.vjuq4ox.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=changeme
PORT=4000
CLIENT_ORIGIN=http://localhost:19006
EOF
    echo "✅ Created .env file with default values"
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

# Start the server
echo "🌟 Starting server on port 4000..."
npm start
