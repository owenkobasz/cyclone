# Cyclone - AI-Powered Cycling Route Generator

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)](https://python.org/)

> **Intelligent cycling route generation powered by AI and OpenStreetMap data**

Cyclone is a modern web application that generates personalized cycling routes based on your location, preferences, and AI-powered recommendations. Built for the UPenn MCIT SPARC 2025 Challenge, it combines cutting-edge routing algorithms with an intuitive user interface to create the perfect cycling experience.

## ✨ Features

- **🚀 AI-Powered Route Generation** - OpenAI integration for intelligent route suggestions
- **🗺️ Multi-Platform Routing** - GraphHopper, Valhalla, and OSM routing engines
- **📍 Smart Location Detection** - Automatic geolocation and address autocomplete
- **📱 Responsive Design** - Modern UI built with React and TailwindCSS
- **🔐 User Authentication** - Secure user profiles and route saving
- **📊 Route Analytics** - Elevation data, distance calculations, and GPX export
- **🌍 OpenStreetMap Integration** - Real-time map data and routing
- **📱 Mobile-First** - Optimized for all devices and screen sizes

## 👥 Authors

- **Owen Kobasz** - [@owenkobasz](https://github.com/owenkobasz)
- **Mandy Shek** - [@mandyshek](https://github.com/mandyshek)
- **Matt Schwartz** - [@mattschwartz91](https://github.com/mattschwartz91)
- **Le Zhang** - [@lez-penn](https://github.com/lez-penn)

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Leaflet** - Interactive maps and routing visualization
- **Framer Motion** - Smooth animations and transitions

### Backend
- **Node.js** - Server runtime with Express.js
- **SQLite** - User authentication and session management
- **Python** - OSM routing and data processing
- **Express.js** - Web framework with session management

### External APIs & Services
- **GraphHopper API** - Professional routing service
- **OpenAI API** - AI-powered route recommendations
- **Valhalla Routing API** - Cycling-optimized routing
- **Open Elevation API** - Elevation data for coordinates
- **IPInfo.io** - IP-based geolocation services

### Data Storage
- **SQLite: Users Database** - User authentication (usernames, hashed passwords)
- **SQLite: Sessions Database** - Session persistence and management
- **SQLite: Routes Database** - Saved user routes and preferences

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Python 3.8+** with pip
- **Git** for cloning the repository

### Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd cyclone

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
pip3 install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development servers
cd ..
./start-dev.sh
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the project root:

```bash
# Required API Keys
GRAPHHOPPER_API_KEY=your_graphhopper_key_here
OPENAI_API_KEY=your_openai_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend Configuration
REACT_APP_API_BASE_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:5173
```

### API Keys Setup
1. **GraphHopper API**: Get your free key at [graphhopper.com](https://www.graphhopper.com/)
2. **OpenAI API**: Create an account at [platform.openai.com](https://platform.openai.com/)

## 🎯 Usage

### Starting the Application
```bash
# Development mode
./start-dev.sh
```

### Using the Application
1. **Navigate to the homepage** - View cycling statistics and features
2. **Generate Routes** - Input your preferences and location
3. **Customize Settings** - Adjust distance, elevation, and route type
4. **Save & Export** - Download GPX files for your cycling apps

### Code Examples

#### Route Generation
```javascript
// Generate a custom route
const route = await generateRoute({
  startLocation: "Philadelphia, PA",
  distance: 25,
  elevation: "moderate",
  routeType: "scenic"
});
```

#### User Authentication
```javascript
// Login user
const user = await loginUser({
  username: "cyclist123",
  password: "securePassword"
});
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Routes
- `POST /api/routes/generate` - Generate new route
- `GET /api/routes/saved` - Get user's saved routes
- `POST /api/routes/save` - Save a route
- `DELETE /api/routes/:id` - Delete a saved route

### User Profiles
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `POST /api/profile/avatar` - Upload profile picture

## 🧪 Development

### Project Structure
```
cyclone/
├── client/          # React frontend
├── server/          # Node.js backend
├── start-dev.sh     # Development startup script
└── requirements.md  # Detailed setup instructions
```

### Available Scripts
```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
npm start            # Start production server
node setup.js        # Run setup and validation
```

### Development Workflow
1. **Frontend**: `cd client && npm run dev` (runs on port 5173)
2. **Backend**: `cd server && node server.js` (runs on port 3000)
3. **Full Stack**: `./start-dev.sh` from project root

## 🙏 Acknowledgments

- **UPenn MCIT SPARC 2025** - Challenge platform and support
- **OpenStreetMap** - Open-source mapping data
- **GraphHopper** - Professional routing services
- **OpenAI** - AI-powered recommendations
- **React & Vite** - Modern web development tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/cyclone/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/cyclone/wiki)
- **Email**: owen@owenkobasz.com

---

**Built with ❤️ for the cycling community**

*Cyclone - Where every ride becomes an adventure*
