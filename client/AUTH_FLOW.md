# Authentication Flow Documentation

## Overview

The application implements a complete authentication system with JWT tokens stored in HTTP-only cookies for security. The auth flow includes registration, login, logout, session refresh, and protected routes.

## Architecture

### Technology Stack

- **Form Management**: React Hook Form
- **Validation**: Zod schemas
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Token Storage**: HTTP-only cookies (handled by backend)

### Key Components

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Manages global authentication state
   - Provides auth methods to components
   - Handles session initialization and refresh

2. **Pages**
   - `Landing.tsx` - Welcome screen with login/register options
   - `Register.tsx` - User registration form
   - `Login.tsx` - User login form
   - `Home.tsx` - Protected dashboard (example)

3. **Components**
   - `ProtectedRoute.tsx` - Route wrapper for authenticated pages
   - `Button.tsx` - Reusable button with loading states
   - `Input.tsx` - Form input with validation errors
   - `FormError.tsx` - Error message display

4. **Utilities**
   - `lib/api.ts` - API client and auth endpoints
   - `schemas/auth.ts` - Zod validation schemas

## User Flow

### Registration Flow

1. User visits landing page (`/`)
2. Clicks "Create Account"
3. Navigates to register page (`/register`)
4. Fills in email and password
5. Client-side validation with Zod:
   - Email format validation
   - Password minimum 8 characters
   - Password requires uppercase, lowercase, and number
6. Form submission via React Hook Form
7. POST request to `/api/auth/register`
8. On success:
   - Backend sets HTTP-only cookies (accessToken, refreshToken)
   - User object stored in AuthContext
   - Redirect to home page (`/home`)
9. On error:
   - Display server error message
   - Keep form data intact for correction

### Login Flow

1. User visits landing page or clicks "Sign In"
2. Navigates to login page (`/login`)
3. Fills in email and password
4. Client-side validation with Zod
5. Form submission via React Hook Form
6. POST request to `/api/auth/login`
7. On success:
   - Backend sets HTTP-only cookies (accessToken, refreshToken)
   - User object stored in AuthContext
   - Redirect to home page (`/home`)
8. On error:
   - Display "Invalid email or password" message

### Session Initialization

When app loads:

1. AuthContext initializes with loading state
2. Attempts to fetch current user from `/api/auth/me`
3. If successful:
   - User is logged in (valid access token in cookies)
   - User object stored in context
4. If fails:
   - User is not logged in
   - Show public routes

### Protected Routes

1. User attempts to access protected page (e.g., `/home`)
2. `ProtectedRoute` component checks auth state:
   - If loading: Show loading spinner
   - If authenticated: Render page
   - If not authenticated: Redirect to `/login`

### Session Refresh

The access token expires after 15 minutes. To handle this:

1. API requests include cookies automatically (withCredentials: true)
2. If 401 response received, can call refresh endpoint
3. POST request to `/api/auth/refresh`
4. Backend validates refresh token (valid for 7 days)
5. On success:
   - New access and refresh tokens set in cookies
   - User can continue using app
6. On failure:
   - User logged out
   - Redirect to login

### Logout Flow

1. User clicks "Logout" button
2. POST request to `/api/auth/logout`
3. Backend clears auth cookies
4. AuthContext clears user state
5. Redirect to landing page (`/`)

## Security Features

### Client-Side

1. **HTTP-only Cookies**: Tokens not accessible via JavaScript
2. **Validation**: Input sanitization and validation before submission
3. **Error Handling**: Graceful error messages without exposing internals
4. **Protected Routes**: Unauthorized users redirected to login

### Backend (Provided)

1. **JWT Tokens**: Signed with secret keys
2. **Password Hashing**: bcrypt with salt rounds
3. **Cookie Security**: 
   - httpOnly: true
   - secure: true (production)
   - sameSite: 'strict'
4. **Token Expiry**:
   - Access token: 15 minutes
   - Refresh token: 7 days

## API Endpoints

All endpoints are in the backend at `/api/auth`:

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error (409):**
```json
{
  "error": "User with this email already exists"
}
```

### POST /api/auth/login

Login existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error (401):**
```json
{
  "error": "Invalid email or password"
}
```

### POST /api/auth/logout

Logout user (requires authentication).

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### POST /api/auth/refresh

Refresh access token using refresh token.

**Response (200):**
```json
{
  "message": "Tokens refreshed successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error (401):**
```json
{
  "error": "Invalid refresh token"
}
```

### GET /api/auth/me

Get current authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error (401):**
```json
{
  "error": "Unauthorized"
}
```

## Form Validation Rules

### Email

- Valid email format (RFC 5322)
- Error message: "Invalid email address"

### Password (Registration)

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- Error messages:
  - "Password must be at least 8 characters"
  - "Password must contain at least one uppercase letter, one lowercase letter, and one number"

### Password (Login)

- Required field
- Error message: "Password is required"

## State Management

### AuthContext State

```typescript
interface AuthContextType {
  user: User | null;           // Current user or null if not logged in
  loading: boolean;            // Loading state during initialization
  login: (user: User) => void; // Function to set logged in user
  logout: () => Promise<void>; // Function to logout user
  refreshAuth: () => Promise<void>; // Function to refresh session
}
```

### User Object

```typescript
interface User {
  id: string;    // Unique user identifier
  email: string; // User email address
}
```

## Testing

### Unit Tests

Located in `src/__tests__/`:

- `Register.test.tsx` - Registration form tests
- `Login.test.tsx` - Login form tests

### Test Coverage

**Register Component:**
- Renders form with all fields
- Validates email format
- Validates password strength
- Validates password requirements (uppercase, lowercase, number)
- Handles successful registration
- Displays server errors
- Disables form during submission
- Links to login page

**Login Component:**
- Renders form with all fields
- Validates email format
- Validates required password
- Handles successful login
- Displays server errors
- Disables form during submission
- Links to register page

### Running Tests

```bash
# Run all tests
yarn workspace @monorepo/client test

# Run tests in watch mode
yarn workspace @monorepo/client test:watch
```

## Error Handling

### Client-Side Errors

1. **Validation Errors**: Displayed inline below form fields
2. **Network Errors**: Generic "Please try again" message
3. **Server Errors**: Specific error message from API response

### Server Error Examples

- "User with this email already exists" (409)
- "Invalid email or password" (401)
- "Unauthorized" (401)
- "Invalid refresh token" (401)

## Mobile Responsiveness

All auth screens are mobile-friendly with:

1. **Responsive Layout**: Adapts to screen sizes
2. **Touch-Friendly**: Large tap targets for buttons
3. **Viewport Optimized**: Uses Tailwind breakpoints
4. **Readable Text**: Appropriate font sizes
5. **Spacing**: Adequate padding for small screens

### Breakpoints

- Mobile: < 640px (default)
- Tablet: >= 640px (sm:)
- Desktop: >= 1024px (lg:)

## Best Practices

### Security

1. Never store tokens in localStorage or sessionStorage
2. Use HTTP-only cookies for token storage
3. Validate all inputs client-side and server-side
4. Show generic error messages for auth failures
5. Use HTTPS in production

### UX

1. Show loading states during async operations
2. Disable forms during submission to prevent double-submit
3. Display clear error messages
4. Provide links between login/register pages
5. Auto-redirect authenticated users from public pages

### Code Quality

1. Use TypeScript for type safety
2. Zod schemas for runtime validation
3. React Hook Form for performant forms
4. Context API for global state
5. Axios interceptors for API configuration

## Future Enhancements

Potential improvements:

1. **Password Reset**: Forgot password flow with email
2. **Email Verification**: Confirm email before full access
3. **Social Auth**: Login with Google, Facebook, etc.
4. **2FA**: Two-factor authentication
5. **Remember Me**: Extended session option
6. **Rate Limiting**: Client-side throttling for failed attempts
7. **Session Management**: View and revoke active sessions
8. **Profile Completion**: Redirect to profile setup after registration

## Troubleshooting

### Common Issues

**Issue**: "Unauthorized" error on protected routes
- **Cause**: Access token expired
- **Solution**: Implement automatic token refresh

**Issue**: Cookies not being set
- **Cause**: CORS misconfiguration
- **Solution**: Ensure `withCredentials: true` in Axios and CORS properly configured on backend

**Issue**: Login successful but user state null
- **Cause**: AuthContext not wrapping app properly
- **Solution**: Ensure AuthProvider wraps all routes

**Issue**: Form validation not working
- **Cause**: Zod schema mismatch with form fields
- **Solution**: Verify schema matches form field names

## Development Tips

1. **Mock API Calls**: Use MSW or vitest mocks for testing
2. **Environment Variables**: Use `.env` files for API URLs
3. **Type Safety**: Import types from shared locations
4. **Consistent Styling**: Use Tailwind utility classes
5. **Accessibility**: Add ARIA labels and keyboard navigation

## Resources

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Axios Documentation](https://axios-http.com/)
- [JWT Best Practices](https://jwt.io/introduction)
