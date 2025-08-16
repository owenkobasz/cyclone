# Project Requirements

## Quick Start

For a completely automated setup, run:
```sh
npm run setup
```

Or alternatively:
```sh
node server/setup.js
```

This script will:
- Check for Node.js and Python3 installation
- Install all dependencies (root, client, and server)
- Create .env template if missing
- Validate API connectivity
- Set up required directories and database

For development only (if already set up):
```sh
./start-dev.sh
```

## Manual Setup

### Frontend (client)

**Main dependencies:**
- react@^18.2.0
- react-dom@^18.2.0
- react-router-dom@^6.30.1
- leaflet@^1.9.4
- react-leaflet@^4.2.1
- framer-motion@^12.23.12
- lucide-react@^0.536.0
- react-google-autocomplete@^2.7.5
- react-just-parallax@^3.1.16
- scroll-lock@^2.1.5

**Dev dependencies:**
- @vitejs/plugin-react@^4.7.0
- tailwindcss@^3.4.1
- postcss@^8.4.31
- autoprefixer@^10.4.21
- vite@^6.3.5

**Install:**
```sh
cd client
npm install
```

If you need to manually install any missing packages:
```sh
npm install react@^18.2.0 react-dom@^18.2.0 react-router-dom@^6.30.1 leaflet@^1.9.4 react-leaflet@^4.2.1 framer-motion@^12.23.12 lucide-react@^0.536.0 react-google-autocomplete@^2.7.5 react-just-parallax@^3.1.16 scroll-lock@^2.1.5
npm install -D @vitejs/plugin-react@^4.7.0 tailwindcss@^3.4.1 postcss@^8.4.31 autoprefixer@^10.4.21 vite@^6.3.5
```

---

## Backend (server)

**Main dependencies:**
- express@^5.1.0
- cors@^2.8.5
- sqlite3@^5.1.7
- bcrypt@^6.0.0
- express-session@^1.18.2
- connect-sqlite3@^0.9.16
- dotenv@^17.2.1
- axios@^1.6.0
- openai@^5.12.2
- multer@^2.0.2

**Python dependencies (for OSM routing):**
- requests>=2.28.0
- osmnx>=1.3.0  
- networkx>=2.8.0
- scikit-learn>=1.0.0

**Install:**
```sh
cd server
npm install

# Set up Python environment (recommended)
./setup_env.sh

# Run setup and validation script
node setup.js
```

**Manual Python setup:**
```sh
cd server
pip3 install -r requirements.txt
```

If you need to manually install any missing Node.js packages:
```sh
npm install express@^5.1.0 cors@^2.8.5 sqlite3@^5.1.7 bcrypt@^6.0.0 express-session@^1.18.2 dotenv@^17.2.1 axios@^1.6.0 openai@^5.12.2 multer@^2.0.2 connect-sqlite3@^0.9.16
```

## Environment Configuration

The setup process is now automated! When you run `node server/setup.js`:

1. **Automatic .env creation**: If no .env file exists, a template will be created
2. **API key validation**: Both GraphHopper and OpenAI keys are tested for validity
3. **Database setup**: User database is automatically created
4. **Directory creation**: All required temp and cache directories are set up
5. **Dependency installation**: All Node.js and Python dependencies are installed

**Required API Keys:**
- `GRAPHHOPPER_API_KEY` - Get from https://www.graphhopper.com/
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `REACT_APP_API_BASE_URL` - Set to your backend URL (default: http://localhost:3000)

**Prerequisites:**
- Node.js (v14 or higher)
- Python 3 (for OSM routing features)
- pip3 (Python package manager)

## Development

- **Frontend development server**: `cd client && npm run dev`
- **Backend server**: `cd server && node server.js`
- **Full development setup**: `./start-dev.sh` (from project root)

## New Automated Features

The latest version includes significant automation improvements:

### 🤖 Automated Setup Process
- **One-command setup**: `npm run setup` handles the entire setup process
- **Dependency management**: Automatically installs all Node.js and Python packages
- **Environment configuration**: Creates .env template with all required variables
- **Database initialization**: Automatically creates and configures SQLite user database

### 🔍 Smart Validation
- **API key testing**: Validates both GraphHopper and OpenAI API keys before use
- **Service connectivity**: Tests all external APIs (Valhalla, Open Elevation)
- **Dependency checking**: Verifies Node.js and Python installation
- **Directory setup**: Creates all required temp, cache, and log directories

### 📊 Enhanced Monitoring
- **Setup status reporting**: Clear success/warning messages with next steps
- **Dependency status**: Shows which packages are installed and working
- **API availability**: Real-time testing of external service connectivity
- **User location detection**: Automatic OSM graph preparation for user's region

### 🛠️ Developer Experience
- **Modular architecture**: Clean separation of services, utilities, and configuration
- **Error handling**: Graceful fallbacks when services are unavailable
- **Debug information**: Detailed logging for troubleshooting
- **Hot reload support**: Development server with automatic restart capabilities