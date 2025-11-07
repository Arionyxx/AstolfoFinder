# Profile Management & Discovery API Documentation

## Overview

The Profile Management & Discovery API provides endpoints for managing user profiles and discovering nearby profiles. Features include personal information management, hobbies, location settings, preferences, and a location-based discovery feed with filtering capabilities. All profile and discovery endpoints require authentication except for the hobbies listing endpoint.

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

## Discovery Feed API

### Get Discovery Profiles

**GET** `/api/discovery/profiles`

Retrieves nearby profiles for the discovery feed based on the user's location and preferences. Excludes already swiped users and the user themselves. Supports pagination and various filtering options.

**Authentication**: Required

**Prerequisites**: User must have location coordinates set in their profile.

**Query Parameters**:
- `limit` (optional): Number of profiles to return (1-50, default: 20)
- `offset` (optional): Number of profiles to skip for pagination (default: 0)
- `radius` (optional): Search radius in miles (1-500, overrides user's preference)
- `genderPreference` (optional): Filter by gender (male/female/non-binary/other)
- `minAge` (optional): Minimum age filter (18-120)
- `maxAge` (optional): Maximum age filter (18-120)
- `sameCity` (optional): Filter to same city only (boolean, default: false)

**Response**:
```json
{
  "profiles": [
    {
      "id": "string",
      "userId": "string",
      "displayName": "string | null",
      "age": "number | null",
      "gender": "male | female | non-binary | other | null",
      "pronouns": "string | null",
      "bio": "string | null",
      "status": "active | inactive | hidden | null",
      "locationLat": "number | null",
      "locationLng": "number | null",
      "distance": "number | null", // Distance in miles, rounded to 1 decimal
      "sharedHobbies": [
        {
          "id": "string",
          "name": "string",
          "description": "string | null",
          "category": "string | null"
        }
      ],
      "photos": [
        {
          "id": "string",
          "url": "string",
          "isPrimary": "boolean"
        }
      ]
    }
  ],
  "pagination": {
    "hasMore": "boolean",
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
}
```

**Example Requests**:
```bash
# Basic discovery request
curl -X GET "http://localhost:5000/api/discovery/profiles" \
  -H "Cookie: accessToken=your_token_here"

# With filters and pagination
curl -X GET "http://localhost:5000/api/discovery/profiles?limit=10&offset=20&radius=30&genderPreference=female&minAge=25&maxAge=35" \
  -H "Cookie: accessToken=your_token_here"

# Same city filter
curl -X GET "http://localhost:5000/api/discovery/profiles?sameCity=true" \
  -H "Cookie: accessToken=your_token_here"
```

**Error Responses**:
- `400 Bad Request`: Invalid query parameters or missing location
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

**Distance Calculation**: Uses Haversine formula to calculate great-circle distance between two points on Earth. Results are returned in miles and rounded to 1 decimal place.

**Sorting**: Profiles are sorted by:
1. Distance (closest first)
2. Number of shared hobbies (highest first, for equal distances)

---

### Get Discovery Preferences

**GET** `/api/discovery/preferences`

Retrieves the user's current discovery preferences, including radius preference and location status.

**Authentication**: Required

**Response**:
```json
{
  "preferences": {
    "radiusPref": "number",
    "hasLocation": "boolean"
  }
}
```

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/discovery/preferences" \
  -H "Cookie: accessToken=your_token_here"
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
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

### Discovery Feed Integration

```javascript
// 1. Check if user has location set
const prefsResponse = await fetch('/api/discovery/preferences', {
  credentials: 'include',
});
const { preferences } = await prefsResponse.json();

if (!preferences.hasLocation) {
  // Prompt user to set location
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
}

// 2. Fetch discovery profiles with filters
const discoveryResponse = await fetch(
  '/api/discovery/profiles?limit=10&radius=25&genderPreference=female&minAge=25&maxAge=35',
  {
    credentials: 'include',
  }
);
const { profiles, pagination } = await discoveryResponse.json();

// 3. Display profiles with distance and shared hobbies
profiles.forEach(profile => {
  console.log(`${profile.displayName} - ${profile.distance} miles away`);
  console.log(`Shared hobbies: ${profile.sharedHobbies.map(h => h.name).join(', ')}`);
  
  // Display primary photo
  const primaryPhoto = profile.photos.find(p => p.isPrimary);
  if (primaryPhoto) {
    console.log(`Photo: ${primaryPhoto.url}`);
  }
});

// 4. Load more profiles (pagination)
if (pagination.hasMore) {
  const nextOffset = pagination.offset + pagination.limit;
  const moreResponse = await fetch(
    `/api/discovery/profiles?limit=10&offset=${nextOffset}&radius=25`,
    {
      credentials: 'include',
    }
  );
  const moreProfiles = await moreResponse.json();
}
```

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

## Assumptions & Technical Considerations

### Distance Calculation
- **Formula**: Uses the Haversine formula for calculating great-circle distance between two points on Earth's surface
- **Unit**: Distances are returned in miles (can be modified to kilometers by changing the Earth's radius constant)
- **Precision**: Rounded to 1 decimal place for user-friendly display
- **Performance**: Calculations are performed in the application layer for simplicity. For high-scale applications, consider using PostgreSQL extensions like `earthdistance` or PostGIS for database-level distance calculations

### Same City Detection
- **Implementation**: Simplified approach using a 10-mile radius threshold
- **Production Consideration**: For more accurate city detection, integrate with a reverse geocoding service (Google Maps, Mapbox, etc.) to determine actual city boundaries

### Privacy & Security
- **Location Data**: Coordinates are stored as floating-point numbers and are not encrypted
- **Exclusion Logic**: Users cannot see themselves or profiles they've already swiped on
- **Rate Limiting**: Not implemented - consider adding rate limiting for discovery endpoints to prevent abuse

### Performance Considerations
- **Database Queries**: Current implementation fetches all potential candidates and filters in-memory
- **Optimization Opportunities**:
  - Use database-level distance calculations with PostgreSQL extensions
  - Implement spatial indexing for faster location-based queries
  - Add caching for frequently accessed profile data
  - Consider pre-computing distance matrices for dense urban areas

### Filtering Logic
- **Gender Preference**: Exact match filter
- **Age Range**: Inclusive range filtering
- **Shared Hobbies**: Calculated dynamically for each request
- **Profile Status**: Only shows profiles with 'active' status

### Pagination
- **Method**: Offset-based pagination (simple but can have performance issues with large offsets)
- **Alternative**: Consider cursor-based pagination for better performance with large datasets
- **Default Limits**: 20 profiles per request, maximum 50

---

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