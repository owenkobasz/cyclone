# Project Requirements

## Frontend (client)

**Main dependencies:**
- react
- react-dom
- react-router-dom
- tailwindcss
- postcss
- autoprefixer
- vite
- leaflet
- react-leaflet

**Dev dependencies:**
- @vitejs/plugin-react
- eslint (optional, for linting)
- eslint-plugin-react (optional, for linting)

**Install:**
```sh
cd client
npm install
```

If you need to manually install any missing packages:
```sh
npm install react react-dom react-router-dom tailwindcss postcss autoprefixer vite leaflet react-leaflet
npm install -D @vitejs/plugin-react eslint eslint-plugin-react
```

---

## Backend (server)

### Python (FastAPI Routing Backend)

**Main dependencies:**
- fastapi
- uvicorn
- osmnx
- networkx
- pydantic
- geopandas
- shapely
- numpy
- pandas
- requests

**Install:**
```sh
cd server
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn osmnx networkx pydantic geopandas shapely numpy pandas requests
```

Or for all osmnx features:
```sh
pip install 'osmnx[all]'
```

---

### Node.js (Express Auth Backend, if used)

**Main dependencies:**
- express
- cors
- sqlite3

**Install:**
```sh
cd server
npm install
```

If you need to manually install any missing packages:
```sh
npm install express cors sqlite3
``` 