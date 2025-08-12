# Cyclone Route API - FastAPI Backend

This is the refactored FastAPI backend for the Cyclone cycling route application.

## Project Structure

```
fastapi/
├── main.py                 # Main application entry point
├── route_backend.py        # Original monolithic file (kept for reference)
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── utils/                  # Utility functions and helpers
│   ├── __init__.py
│   ├── graph_loader.py    # Graph loading utilities
│   ├── node_utils.py      # Node-related operations
│   ├── response_formatter.py # API response formatting
│   ├── routing_algorithms.py # All routing algorithms
│   └── models.py          # Pydantic data models
├── routes/                 # API route definitions
│   ├── __init__.py
│   └── routing.py         # Main routing endpoints
└── test_refactor.py       # Test script for the refactored structure
```

## Key Improvements

### 1. **Modular Structure**
- Separated concerns into logical modules
- Each utility function has its own file
- Clear separation between business logic and API endpoints

### 2. **Better Organization**
- `utils/` - Reusable utility functions
- `routes/` - API endpoint definitions
- `models/` - Data validation and serialization

### 3. **Enhanced Maintainability**
- Easier to add new routing algorithms
- Simpler to modify individual components
- Better testability with isolated functions

### 4. **Improved API Design**
- Proper Pydantic models for request/response validation
- Consistent error handling
- Better API documentation

## API Endpoints

### `/api/generate-custom-route` (POST)
Generate routes between two points with custom preferences:
- Bike lane preference
- Hill avoidance
- Target distance specification

### `/api/generate-loop-route` (POST)
Generate loop routes starting and ending at the same point.

### `/api/route-options` (GET)
Get information about available routing algorithms and features.

## Running the Application

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
uvicorn main:app --reload
```

### Docker
```bash
# Build the container
docker build -t cyclone-fastapi .

# Run the container
docker run -p 8000:8000 cyclone-fastapi
```

## Testing

Run the test script to verify the refactored structure:
```bash
python test_refactor.py
```

## Dependencies

- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **OSMnx** - OpenStreetMap data processing
- **NetworkX** - Graph algorithms
- **Pydantic** - Data validation
- **GDAL** - Geospatial data processing

## Notes

- The original `route_backend.py` is kept for reference
- All routing algorithms have been preserved and enhanced
- The API maintains backward compatibility
- Docker configuration has been updated to use the new structure 