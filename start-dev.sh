#!/bin/bash
# Development server startup script

echo "🚀 Starting CYCLONE development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found. Please run this script from the project root directory."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "client/node_modules" ]; then
    echo "❌ Frontend dependencies not installed. Please run: cd client && npm install"
    exit 1
fi

if [ ! -d "server/node_modules" ]; then
    echo "❌ Backend dependencies not installed. Please run: cd server && npm install"
    exit 1
fi

echo "✅ Dependencies are installed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Please run setup first: node server/setup.js"
    exit 1
fi

echo "✅ Environment configuration found"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null
    fi
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    echo "✅ Development servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🌐 Starting backend server..."
cd server
npm start &
SERVER_PID=$!
cd ..

echo "⚡ Starting frontend development server..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "🎉 CYCLONE development servers are starting up!"
echo ""
echo "📱 Frontend: http://localhost:5173 (Vite dev server)"
echo "🔧 Backend:  http://localhost:3000 (Express server)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait
