# API Documentation - OpenAPI/Swagger Format

## Overview

This document provides a comprehensive OpenAPI 3.0 specification for the authentication API.

## Base URL

```
http://localhost:5000
```

## Authentication

Authentication is handled via HTTP-only cookies containing JWT tokens:
- `accessToken` - Short-lived JWT (15 minutes)
- `refreshToken` - Long-lived JWT (7 days)

Tokens are automatically sent with each request and are secure (HTTP-only, SameSite strict).

---

## Endpoints

### 1. Register User

Create a new user account.

```yaml
POST /api/auth/register
Content-Type: application/json

Request Body:
  email:
    type: string
    format: email
    required: true
    example: "user@example.com"
  password:
    type: string
    required: true
    minLength: 8
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
    example: "SecurePassword123"

Responses:
  201:
    description: User registered successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            message:
              type: string
              example: "User registered successfully"
            user:
              type: object
              properties:
                id:
                  type: string
                  example: "cuid_123456"
                email:
                  type: string
                  example: "user@example.com"
    headers:
      Set-Cookie:
        schema:
          type: string
          example: |
            accessToken=eyJhbGc...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
            refreshToken=eyJhbGc...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

  400:
    description: Validation error
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Invalid input"

  409:
    description: User already exists
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "User with this email already exists"
```

---

### 2. Login User

Authenticate and obtain tokens.

```yaml
POST /api/auth/login
Content-Type: application/json

Request Body:
  email:
    type: string
    format: email
    required: true
    example: "user@example.com"
  password:
    type: string
    required: true
    example: "SecurePassword123"

Responses:
  200:
    description: Login successful
    content:
      application/json:
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Login successful"
            user:
              type: object
              properties:
                id:
                  type: string
                  example: "cuid_123456"
                email:
                  type: string
                  example: "user@example.com"
    headers:
      Set-Cookie:
        schema:
          type: string
          example: |
            accessToken=eyJhbGc...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
            refreshToken=eyJhbGc...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

  400:
    description: Validation error
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Invalid input"

  401:
    description: Invalid credentials
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Invalid email or password"
```

---

### 3. Refresh Tokens

Obtain new access token using refresh token.

```yaml
POST /api/auth/refresh
Cookie: refreshToken=eyJhbGc...

Responses:
  200:
    description: Tokens refreshed successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Tokens refreshed successfully"
            user:
              type: object
              properties:
                id:
                  type: string
                email:
                  type: string
    headers:
      Set-Cookie:
        schema:
          type: string
          example: |
            accessToken=eyJhbGc...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
            refreshToken=eyJhbGc...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

  401:
    description: Invalid or missing refresh token
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Invalid refresh token"
```

---

### 4. Logout

Clear authentication cookies.

```yaml
POST /api/auth/logout
Cookie: accessToken=eyJhbGc...
Authorization: Bearer (implicit via cookie)

Responses:
  200:
    description: Logout successful
    content:
      application/json:
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Logout successful"
    headers:
      Set-Cookie:
        schema:
          type: string
          example: |
            accessToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0
            refreshToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0

  401:
    description: Not authenticated
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Unauthorized"
```

---

### 5. Get Current User

Retrieve authenticated user information.

```yaml
GET /api/auth/me
Cookie: accessToken=eyJhbGc...
Authorization: Bearer (implicit via cookie)

Responses:
  200:
    description: Current user information
    content:
      application/json:
        schema:
          type: object
          properties:
            user:
              type: object
              properties:
                userId:
                  type: string
                  example: "cuid_123456"
                email:
                  type: string
                  example: "user@example.com"

  401:
    description: Not authenticated
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Unauthorized"
```

---

## Common Response Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Validation failed or malformed request |
| 401 | Unauthorized - Missing or invalid authentication |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Password Requirements

Passwords must meet the following criteria:
- **Minimum length**: 8 characters
- **Must contain**: At least one uppercase letter (A-Z)
- **Must contain**: At least one lowercase letter (a-z)
- **Must contain**: At least one number (0-9)

Example valid passwords:
- `SecurePassword123`
- `MyP@ssw0rd`
- `Correct2Horse1Battery`

---

## Cookie Security

### HTTP-Only Cookies

All authentication cookies are:
- **HttpOnly**: Not accessible via JavaScript (prevents XSS attacks)
- **Secure**: Only sent over HTTPS in production
- **SameSite=Strict**: Prevents CSRF attacks by restricting cross-site cookie usage

### Cookie Expiry Times

- **Access Token**: 15 minutes (900 seconds)
- **Refresh Token**: 7 days (604800 seconds)

### Production Considerations

In production:
1. Ensure all cookies have `Secure` flag (HTTPS only)
2. Use environment-specific JWT secrets
3. Implement refresh token rotation
4. Monitor token usage for suspicious activity
5. Consider implementing rate limiting on auth endpoints

---

## Error Handling

### Validation Errors

When validation fails, the response includes validation details:

```json
{
  "error": "Invalid input"
}
```

### Authentication Errors

When authentication fails:

```json
{
  "error": "Invalid email or password"
}
```

Or:

```json
{
  "error": "Unauthorized"
}
```

---

## Example Usage

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePassword123"}' \
  -c cookies.txt

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePassword123"}' \
  -c cookies.txt

# Get current user (using saved cookies)
curl -X GET http://localhost:5000/api/auth/me \
  -b cookies.txt

# Refresh tokens
curl -X POST http://localhost:5000/api/auth/refresh \
  -b cookies.txt

# Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

### Using Fetch API (JavaScript)

```javascript
// Register
const register = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Important: include cookies
  });
  return response.json();
};

// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Important: include cookies
  });
  return response.json();
};

// Get current user
const getCurrentUser = async () => {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    method: 'GET',
    credentials: 'include', // Important: include cookies
  });
  return response.json();
};

// Logout
const logout = async () => {
  const response = await fetch('http://localhost:5000/api/auth/logout', {
    method: 'POST',
    credentials: 'include', // Important: include cookies
  });
  return response.json();
};

// Refresh tokens
const refreshTokens = async () => {
  const response = await fetch('http://localhost:5000/api/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Important: include cookies
  });
  return response.json();
};
```

---

## Database Schema

The User model in Prisma schema:

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
  verificationToken String?   @unique
  resetToken        String?   @unique
  resetTokenExpires DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  profile           Profile?
  swipesAsActor     Swipe[]   @relation("SwipeActor")
  swipesAsTarget    Swipe[]   @relation("SwipeTarget")
  matchesAsUser1    Match[]   @relation("MatchUser1")
  matchesAsUser2    Match[]   @relation("MatchUser2")

  @@map("users")
}
```

**Fields:**
- `id` - Unique user identifier (CUID)
- `email` - Unique email address
- `passwordHash` - Bcrypt hashed password (never plain text)
- `emailVerified` - Email verification status
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

---

## Testing

Run the auth test suite:

```bash
yarn test
```

Tests cover:
- ✓ Password hashing and comparison
- ✓ Token generation and verification
- ✓ User registration
- ✓ Duplicate user prevention
- ✓ Login with valid/invalid credentials
- ✓ Token refresh
- ✓ Route protection and authorization

---

## Integration with Protected Routes

To protect your routes with authentication:

```typescript
import express from 'express';
import { requireAuth } from './middleware/auth.middleware.js';

const router = express.Router();

// Protected route
router.get('/my-profile', requireAuth, (req, res) => {
  const { userId, email } = req.user!;
  // Access authenticated user info
  res.json({ userId, email });
});

export default router;
```

The `req.user` object contains:
```typescript
{
  userId: string;
  email: string;
}
```

---

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Secrets**: Use strong, randomly generated JWT secrets
3. **Rate Limiting**: Implement rate limiting on auth endpoints
4. **Input Validation**: Validate all input with Zod schemas
5. **Password Requirements**: Enforce strong password requirements
6. **Token Expiry**: Use short expiry times for access tokens
7. **Refresh Rotation**: Consider rotating refresh tokens
8. **CORS**: Configure CORS appropriately for your frontend

---

## Swipe and Match Endpoints

### 7. Record Swipe

Record a like or pass action on another user.

```yaml
POST /api/swipes
Content-Type: application/json
Cookie: accessToken=eyJhbGc...
Authorization: Bearer (implicit via cookie)

Request Body:
  targetId:
    type: string
    required: true
    description: ID of the user being swiped on
    example: "cuid_target_123456"
  direction:
    type: string
    enum: ["like", "pass"]
    required: true
    example: "like"

Responses:
  201:
    description: Swipe recorded successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            swipe:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                swipeId:
                  type: string
                  example: "cuid_swipe_123456"
                matchCreated:
                  type: boolean
                  description: true if mutual like created a match
                  example: false
                message:
                  type: string
                  example: "Swiped like"

  400:
    description: Validation error or invalid request
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Invalid input"

  401:
    description: Not authenticated
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Unauthorized"

  409:
    description: Already swiped on this user
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "You have already swiped on this user"

  429:
    description: Daily swipe limit reached (100 per UTC day)
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Daily swipe limit of 100 reached. Limit resets at midnight UTC."
            retryAfter:
              type: string
              example: "midnight UTC"
```

---

### 8. Get Swipe Statistics

Get current swipe count and remaining swipes for today.

```yaml
GET /api/swipes/status
Cookie: accessToken=eyJhbGc...
Authorization: Bearer (implicit via cookie)

Responses:
  200:
    description: Swipe statistics retrieved
    content:
      application/json:
        schema:
          type: object
          properties:
            stats:
              type: object
              properties:
                totalSwipesToday:
                  type: integer
                  example: 25
                swipesRemaining:
                  type: integer
                  example: 75
                resetTime:
                  type: string
                  format: date-time
                  description: UTC time when daily limit resets
                  example: "2024-01-16T00:00:00.000Z"

  401:
    description: Not authenticated
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Unauthorized"
```

---

### 9. Get All Matches

Get list of all matches for the current user.

```yaml
GET /api/matches
Cookie: accessToken=eyJhbGc...
Authorization: Bearer (implicit via cookie)

Responses:
  200:
    description: List of matches
    content:
      application/json:
        schema:
          type: object
          properties:
            matches:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                    example: "cuid_match_123456"
                  matchedWithId:
                    type: string
                    example: "cuid_user_789012"
                  matchedWithName:
                    type: string
                    nullable: true
                    example: "Jane Smith"
                  createdAt:
                    type: string
                    format: date-time
                    example: "2024-01-15T14:30:00.000Z"
                  lastInteraction:
                    type: string
                    format: date-time
                    nullable: true
                    example: "2024-01-15T15:45:00.000Z"
            total:
              type: integer
              example: 3

  401:
    description: Not authenticated
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Unauthorized"
```

---

### 10. Get Match Details

Get detailed information about a specific match.

```yaml
GET /api/matches/{matchId}
Cookie: accessToken=eyJhbGc...
Authorization: Bearer (implicit via cookie)

Path Parameters:
  matchId:
    type: string
    required: true
    example: "cuid_match_123456"

Responses:
  200:
    description: Match details
    content:
      application/json:
        schema:
          type: object
          properties:
            match:
              type: object
              properties:
                id:
                  type: string
                  example: "cuid_match_123456"
                matchedWith:
                  type: object
                  properties:
                    id:
                      type: string
                      example: "cuid_user_789012"
                    displayName:
                      type: string
                      nullable: true
                      example: "Jane Smith"
                    age:
                      type: integer
                      nullable: true
                      example: 26
                    gender:
                      type: string
                      nullable: true
                      example: "female"
                    bio:
                      type: string
                      nullable: true
                      example: "Love traveling and photography"
                    primaryPhoto:
                      type: string
                      nullable: true
                      format: uri
                      example: "https://example.com/photo.jpg"
                createdAt:
                  type: string
                  format: date-time
                  example: "2024-01-15T14:30:00.000Z"
                lastInteraction:
                  type: string
                  format: date-time
                  nullable: true
                  example: "2024-01-15T15:45:00.000Z"

  401:
    description: Not authenticated
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Unauthorized"

  403:
    description: User is not part of this match
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Unauthorized to view this match"

  404:
    description: Match not found
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Match not found"
```

---

## Swipe and Match Flow

### Daily Swipe Limit

- **Limit**: 100 swipes per UTC day (00:00 UTC to 23:59:59 UTC)
- **Reset**: Automatically resets at midnight UTC
- **Tracking**: Uses `swipeDate` field in Swipe model
- **Status**: Check remaining swipes via `GET /api/swipes/status`

### Mutual Like and Match Creation

1. User A swipes "like" on User B
2. If User B has already swiped "like" on User A:
   - A Match record is created automatically
   - Both users are notified (placeholder for notification system)
3. If User B hasn't swiped yet:
   - Swipe is recorded and saved
   - Match is not created yet
3. If User B swipes "like" later:
   - The system detects the mutual like
   - A Match is created automatically

### Swipe States

- **Like**: Positive interest in a user. Can lead to Match creation if mutual.
- **Pass**: No interest. Prevents future swipes on this user.
- **Mutual Like**: Both users have swiped "like" on each other, resulting in a Match.

### Example Scenarios

**Scenario 1: One-way like**
```
User A swipes "like" on User B
→ Swipe recorded with matchCreated=false
→ No match created until User B also likes User A
```

**Scenario 2: Mutual like (A first)**
```
User B swipes "like" on User A (first)
User A swipes "like" on User B (second)
→ Swipe recorded with matchCreated=true
→ Match created automatically
→ Both users are notified
```

**Scenario 3: Pass**
```
User A swipes "pass" on User B
→ Swipe recorded
→ No match created regardless of User B's action
```

---

## Support

For issues or questions about the swipe and match API:
1. Check the test files for usage examples
2. Review the README.md for additional documentation
3. Check server logs for detailed error messages
