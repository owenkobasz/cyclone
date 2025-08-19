# 🚴‍♂️ Cyclone API Documentation

> **Complete Interface & API Definitions for Frontend and Backend Routes**

This document provides comprehensive documentation for all API endpoints, request/response schemas, and data structures used in the Cyclone cycling route generation application.

## 📋 Table of Contents

- [Authentication & Session Management](#authentication--session-management)
- [User Management](#user-management)
- [Route Generation](#route-generation)
- [Route Management](#route-management)
- [User Profiles](#user-profiles)
- [Geolocation Services](#geolocation-services)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

---

## 🔐 Authentication & Session Management

### Session Configuration
- **Store**: SQLite with `connect-sqlite3`
- **Secret**: `cycloneisagreatapplicationandeveryonelovesitsomuch`
- **Cookie Settings**:
  - `maxAge`: 7 days
  - `secure`: false (development), true (production)
  - `httpOnly`: true
  - `sameSite`: 'lax'

### POST `/api/login`
**Purpose**: User authentication and login

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "message": "Successful login",
  "ok": true,
  "username": "string",
  "name": "string",
  "avatar": "string"
}
```

**Error Responses**:
- `400`: Missing username/password
- `401`: Incorrect password
- `404`: User not found
- `500`: Server error

### POST `/api/register`
**Purpose**: User registration

**Request Body**:
```json
{
  "username": "string",
  "password": "string",
  "passwordConf": "string",
  "firstName": "string",
  "lastName": "string"
}
```

**Response**:
```json
{
  "message": "User registered successfully! Please log in.",
  "ok": true
}
```

**Error Responses**:
- `400`: Missing required fields
- `401`: Username already exists, password mismatch, invalid credentials
- `500`: Database/server error

### POST `/api/logout`
**Purpose**: User logout and session destruction

**Response**:
```json
{
  "ok": true,
  "message": "Logged out successfully"
}
```

### GET `/api/status`
**Purpose**: Check authentication status and get user info

**Response (Authenticated)**:
```json
{
  "loggedIn": true,
  "name": "string",
  "avatar": "string"
}
```

**Response (Unauthenticated)**:
```json
{
  "loggedIn": false
}
```

---

## 👤 User Management

### GET `/api/debug-session`
**Purpose**: Debug session information (development only)

**Response**:
```json
{
  "sessionExists": true,
  "sessionUser": {
    "username": "string",
    "name": "string",
    "avatar": "string",
    "firstName": "string",
    "lastName": "string",
    "id": "string"
  },
  "sessionID": "string"
}
```

---

## 🗺️ Route Generation

### POST `/api/generate-custom-route`
**Purpose**: Generate AI-powered cycling routes

**Request Body**:
```json
{
  "start_lat": "number",
  "start_lon": "number",
  "end_lat": "number",
  "end_lon": "number",
  "destination_name": "string",
  "starting_point_name": "string",
  "avoid_hills": false,
  "use_bike_lanes": true,
  "target_distance": 5.0,
  "max_elevation_gain": 100.0,
  "unit_system": "imperial",
  "route_type": "scenic",
  "avoid_traffic": false,
  "elevation_focus": false,
  "custom_description": ""
}
```

**Parameters**:
- `start_lat`, `start_lon`: **Required** - Starting coordinates
- `end_lat`, `end_lon`: Optional - End coordinates (if not provided, generates loop route)
- `target_distance`: Target route length in miles/kilometers
- `route_type`: Route style ("scenic", "fast", "balanced")
- `unit_system`: "imperial" or "metric"
- `avoid_hills`: Boolean to avoid steep climbs
- `use_bike_lanes`: Boolean to prefer bike-friendly roads
- `avoid_traffic`: Boolean to minimize traffic exposure

**Response**:
```json
{
  "route": [
    {
      "lat": "number",
      "lon": "number",
      "elevation": "number"
    }
  ],
  "difficulty": "string",
  "total_elevation_gain": "number",
  "total_ride_time": "string",
  "total_length_formatted": "string",
  "data_source": "string",
  "cue_sheet": [
    {
      "instruction": "string",
      "distance": "string",
      "elevation": "string"
    }
  ]
}
```

**Error Responses**:
- `422`: Missing required parameters
- `500`: Route generation failed

---

## 🛣️ Route Management

### POST `/api/routes/save`
**Purpose**: Save generated route to user's collection

**Authentication**: Required

**Request Body**:
```json
{
  "routeName": "string",
  "waypoints": [
    {
      "lat": "number",
      "lon": "number",
      "elevation": "number"
    }
  ],
  "rawStats": {
    "distance": "number",
    "elevation": "number",
    "duration": "string"
  },
  "cueSheet": [
    {
      "instruction": "string",
      "distance": "string",
      "elevation": "string"
    }
  ],
  "preferences": {
    "route_type": "string",
    "avoid_hills": "boolean",
    "use_bike_lanes": "boolean"
  }
}
```

**Response**:
```json
{
  "message": "Route saved successfully"
}
```

### GET `/api/routes`
**Purpose**: Retrieve user's saved routes

**Authentication**: Required

**Response**:
```json
[
  {
    "id": "number",
    "username": "string",
    "routeName": "string",
    "waypoints": "array",
    "rawStats": "object",
    "cueSheet": "array",
    "preferences": "object",
    "createdAt": "string"
  }
]
```

### DELETE `/api/routes/:id`
**Purpose**: Delete a saved route

**Authentication**: Required

**Parameters**:
- `id`: Route ID to delete

**Response**:
```json
{
  "message": "Route deleted successfully"
}
```

---

## 👤 User Profiles

### GET `/api/user/profile`
**Purpose**: Get current user's profile

**Authentication**: Required

**Response**:
```json
{
  "id": "string",
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "address": "string",
  "profilePicture": "string",
  "avatar": "string"
}
```

### PUT `/api/user/profile/:id`
**Purpose**: Update user profile

**Authentication**: Required

**Request Body** (multipart/form-data):
```json
{
  "firstName": "string",
  "lastName": "string",
  "address": "string",
  "avatar": "file" // Optional image file
}
```

**Response**:
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "string",
    "username": "string",
    "firstName": "string",
    "lastName": "string",
    "address": "string",
    "profilePicture": "string",
    "avatar": "string"
  }
}
```

### GET `/api/user/profile/:username`
**Purpose**: Get profile by username

**Response**:
```json
{
  "id": "string",
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "address": "string",
  "profilePicture": "string",
  "avatar": "string"
}
```

---

## 📍 Geolocation Services

### GET `/api/location`
**Purpose**: Get user's location based on IP address

**Response**:
```json
{
  "success": true,
  "location": {
    "lat": "number",
    "lon": "number",
    "city": "string",
    "region": "string",
    "country": "string",
    "place": "string"
  },
  "ip": "string"
}
```

**Fallback Response** (on error):
```json
{
  "success": false,
  "error": "Failed to get location",
  "location": {
    "lat": 39.9526,
    "lon": -75.1652,
    "city": "Philadelphia",
    "region": "Pennsylvania",
    "country": "US",
    "place": "Philadelphia, Pennsylvania, USA"
  }
}
```

---

## 🗄️ Data Models

### User Profile Schema
```json
{
  "id": "string",
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "address": "string",
  "profilePicture": "string",
  "avatar": "string"
}
```

### Route Schema
```json
{
  "id": "number",
  "username": "string",
  "routeName": "string",
  "waypoints": [
    {
      "lat": "number",
      "lon": "number",
      "elevation": "number"
    }
  ],
  "rawStats": {
    "distance": "number",
    "elevation": "number",
    "duration": "string"
  },
  "cueSheet": [
    {
      "instruction": "string",
      "distance": "string",
      "elevation": "string"
    }
  ],
  "preferences": {
    "route_type": "string",
    "avoid_hills": "boolean",
    "use_bike_lanes": "boolean"
  },
  "createdAt": "string"
}
```

### Session User Schema
```json
{
  "username": "string",
  "name": "string",
  "avatar": "string",
  "firstName": "string",
  "lastName": "string",
  "id": "string"
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request - Missing or invalid parameters
- `401`: Unauthorized - Authentication required
- `404`: Not Found - Resource doesn't exist
- `422`: Unprocessable Entity - Validation errors
- `500`: Internal Server Error - Server-side error

### Validation Error Format
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "field_name"],
      "msg": "Field required"
    }
  ]
}
```

---

## 🔧 Development & Testing

### Test Endpoints

#### GET `/api/test/endpoint`
**Purpose**: Verify server.js is active

**Response**:
```json
{
  "message": "Server.js is definitely active!"
}
```

#### GET `/api/debug-profile-test`
**Purpose**: Debug profile reading (development only)

**Response**:
```json
{
  "profilesPath": "string",
  "profileCount": "number",
  "profiles": "array",
  "user5": "object"
}
```

#### PUT `/api/test-put/:id`
**Purpose**: Test PUT functionality

**Response**:
```json
{
  "message": "Test PUT route working",
  "id": "string",
  "body": "object",
  "session": "object"
}
```

#### POST `/api/test-form`
**Purpose**: Test form data parsing

**Request**: multipart/form-data

**Response**:
```json
{
  "received": "object",
  "fields": {
    "firstName": "string",
    "lastName": "string",
    "address": "string"
  }
}
```

---

## 🌐 CORS Configuration

**Allowed Origins**:
- Configured frontend origin (`FRONTEND_ORIGIN`)
- `http://localhost`
- `http://127.0.0.1`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:80`

**Settings**:
- `credentials`: true
- `origin`: Dynamic origin validation

---

## 📁 File Uploads

### Avatar Upload Configuration
- **Storage**: Local disk storage
- **Directory**: `/server/public/avatars/`
- **File Types**: JPG, JPEG, PNG only
- **Size Limit**: 5MB
- **Naming**: `{fieldname}-{timestamp}-{random}.{ext}`

### Upload Endpoints
- `PUT /api/user/profile/:id` - Profile picture update
- `POST /api/test-form` - Test file upload

---

## 🔒 Security Considerations

### Authentication
- Session-based authentication with SQLite storage
- Password hashing with bcrypt (10 salt rounds)
- Session timeout: 7 days
- HTTP-only cookies for session management

### Input Validation
- Username/password validation
- File type and size restrictions
- Coordinate validation for route generation
- Required field validation

### Session Management
- Secure session configuration
- Session destruction on logout
- Cookie clearing on logout
- Trust proxy configuration for production

---

## 📚 Additional Resources

- **Frontend Routes**: See `client/src/App.jsx` for React Router configuration
- **Backend Services**: See `server/services/` for route generation logic
- **Database Schema**: See `server/databases/` for data structure
- **Middleware**: See `server/middleware/` for authentication logic

---

*Last Updated: January 2025*
*Cyclone API Documentation v1.0*
