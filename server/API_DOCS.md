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

## Support

For issues or questions about the auth API:
1. Check the test files for usage examples
2. Review the README.md for additional documentation
3. Check server logs for detailed error messages
