# Profile Management API Documentation

## Overview

The Profile Management API provides endpoints for managing user profiles, including personal information, hobbies, location settings, and preferences. All profile endpoints require authentication except for the hobbies listing endpoint.

## Base URL
`/api`

## Authentication

All profile endpoints (except `/hobbies`) require authentication via HTTP-only cookies:
- `accessToken`: JWT token for authentication (15-minute expiry)
- `refreshToken`: JWT token for refreshing access token (7-day expiry)

Use the `/api/auth/login` endpoint to authenticate and receive these cookies.

## Endpoints

### Get User Profile

**GET** `/profile`

Retrieves the authenticated user's complete profile information including hobbies.

**Authentication**: Required

**Response**:
```json
{
  "profile": {
    "id": "string",
    "displayName": "string | null",
    "age": "number | null",
    "gender": "male | female | non-binary | other | null",
    "pronouns": "string | null",
    "bio": "string | null",
    "status": "active | inactive | hidden",
    "locationLat": "number | null",
    "locationLng": "number | null",
    "radiusPref": "number",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)",
    "hobbies": [
      {
        "id": "string",
        "name": "string",
        "description": "string | null",
        "category": "string"
      }
    ]
  }
}
```

**Example Request**:
```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Cookie: accessToken=your_token_here"
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

---

### Update User Profile

**PUT** `/profile`

Updates the authenticated user's profile information. All fields are optional - only provided fields will be updated.

**Authentication**: Required

**Request Body**:
```json
{
  "displayName": "string (1-50 chars) | optional",
  "age": "number (18-120) | optional",
  "gender": "male | female | non-binary | other | optional",
  "pronouns": "string (max 50 chars) | optional",
  "bio": "string (max 500 chars) | optional",
  "status": "active | inactive | hidden | optional",
  "locationLat": "number (-90 to 90) | optional",
  "locationLng": "number (-180 to 180) | optional",
  "radiusPref": "number (1-500) | optional",
  "hobbies": "array of hobby IDs | optional"
}
```

**Response**:
```json
{
  "message": "Profile updated successfully",
  "profile": {
    // Same structure as GET /profile response
  }
}
```

**Example Request**:
```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your_token_here" \
  -d '{
    "displayName": "John Doe",
    "age": 25,
    "gender": "male",
    "pronouns": "he/him",
    "bio": "Software developer who loves coding!",
    "status": "active",
    "radiusPref": 50,
    "hobbies": ["hobby_id_1", "hobby_id_2"]
  }'
```

**Error Responses**:
- `400 Bad Request`: Invalid input data or invalid hobby IDs
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

---

### Update User Location

**POST** `/profile/location`

Updates the authenticated user's geographic coordinates. Supports both automatic geolocation and manual entry.

**Authentication**: Required

**Request Body**:
```json
{
  "lat": "number (-90 to 90) - required",
  "lng": "number (-180 to 180) - required",
  "manualEntry": "boolean - optional (default: false)"
}
```

**Response**:
```json
{
  "message": "Location updated successfully",
  "location": {
    "lat": "number",
    "lng": "number"
  }
}
```

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/profile/location \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your_token_here" \
  -d '{
    "lat": 40.7128,
    "lng": -74.0060,
    "manualEntry": false
  }'
```

**Error Responses**:
- `400 Bad Request`: Invalid coordinates
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

---

### Get Available Hobbies

**GET** `/hobbies`

Retrieves all available hobbies and interests that users can add to their profile. Can be filtered by category.

**Authentication**: Not required

**Query Parameters**:
- `category` (optional): Filter hobbies by category

**Response**:
```json
{
  "hobbies": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "category": "string"
    }
  ]
}
```

**Example Requests**:
```bash
# Get all hobbies
curl -X GET http://localhost:5000/api/hobbies

# Get hobbies by category
curl -X GET http://localhost:5000/api/hobbies?category=Sports%20%26%20Fitness
```

**Error Responses**:
- `500 Internal Server Error`: Server error

---

## Data Models

### Profile Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | string | Unique profile identifier | Auto-generated |
| `displayName` | string | User's display name | 1-50 characters |
| `age` | number | User's age | 18-120 |
| `gender` | enum | Gender identity | male, female, non-binary, other |
| `pronouns` | string | Preferred pronouns | Max 50 characters |
| `bio` | string | Personal biography | Max 500 characters |
| `status` | enum | Profile visibility | active, inactive, hidden |
| `locationLat` | number | Latitude coordinate | -90 to 90 |
| `locationLng` | number | Longitude coordinate | -180 to 180 |
| `radiusPref` | number | Search radius preference | 1-500 (miles/km) |
| `hobbies` | array | User's hobbies and interests | Array of hobby IDs |

### Hobby Categories

The system includes hobbies across these categories:
- Sports & Fitness
- Arts & Culture
- Food & Drink
- Travel & Adventure
- Technology & Gaming
- Lifestyle & Social
- Intellectual & Educational
- Wellness & Spirituality

## Usage Examples

### Complete Profile Setup

```javascript
// 1. Get available hobbies
const hobbiesResponse = await fetch('/api/hobbies');
const { hobbies } = await hobbiesResponse.json();

// 2. Select some hobbies
const selectedHobbies = hobbies
  .filter(h => ['Sports & Fitness', 'Technology & Gaming'].includes(h.category))
  .slice(0, 5)
  .map(h => h.id);

// 3. Update profile
const profileResponse = await fetch('/api/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies for authentication
  body: JSON.stringify({
    displayName: 'Alice Johnson',
    age: 28,
    gender: 'female',
    pronouns: 'she/her',
    bio: 'Tech enthusiast and fitness lover looking for new adventures!',
    status: 'active',
    radiusPref: 30,
    hobbies: selectedHobbies,
  }),
});

const { profile } = await profileResponse.json();

// 4. Set location
await fetch('/api/profile/location', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    lat: 37.7749,
    lng: -122.4194,
    manualEntry: true,
  }),
});
```

### Geolocation Integration

```javascript
// Get user's current location (browser geolocation API)
navigator.geolocation.getCurrentPosition(
  async (position) => {
    const { latitude, longitude } = position.coords;
    
    // Send to server
    await fetch('/api/profile/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        lat: latitude,
        lng: longitude,
        manualEntry: false, // Automatic geolocation
      }),
    });
  },
  (error) => {
    console.error('Geolocation error:', error);
    // Fall back to manual entry
  }
);
```

## Error Handling

All endpoints follow consistent error response formats:

```json
{
  "error": "Error message",
  "details": [] // Only for validation errors (400)
}
```

Common error scenarios:
- **401 Unauthorized**: Missing or invalid authentication token
- **400 Bad Request**: Invalid input data, validation errors, or invalid hobby IDs
- **500 Internal Server Error**: Database errors, server issues

## Rate Limiting

Currently, there are no rate limits implemented on profile endpoints. Consider implementing rate limiting for production use.

## Security Considerations

- All profile modifications require authentication
- Location data is validated for coordinate bounds
- Hobby IDs are validated against existing hobbies
- Input sanitization prevents XSS attacks
- HTTP-only cookies prevent token access via JavaScript