# Profile Editor Documentation

## Overview

The Profile Editor is a multi-step form component that allows users to create and edit their profile information. It provides a user-friendly interface for collecting personal information, preferences, and location data.

## Features

### Multi-Step Form
- **6 Steps**: Basic Information → About You → Hobbies & Interests → Location → Search Radius → Review
- **Progress Indicator**: Visual progress bar showing current step
- **Navigation**: Previous/Next buttons with validation
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Step Details

#### Step 1: Basic Information
- **Avatar Upload**: Profile photo upload (placeholder implementation)
- **Display Name**: Required field, max 50 characters
- **Pronouns**: Required field with predefined options and custom input
- **Gender Identity**: Required field with predefined options
- **Age**: Required field, must be 18-120 years old

#### Step 2: About You
- **Bio**: Optional field, max 500 characters with character counter
- **Profile Status**: Active, Inactive, or Hidden

#### Step 3: Hobbies & Interests
- **Hobby Selection**: Multi-select from API-fetched hobbies
- **Additional Interests**: Free text field for other interests

#### Step 4: Location
- **Geolocation**: Automatic location detection using browser API
- **Manual Entry**: Manual latitude/longitude input as fallback
- **Location Validation**: Coordinate range validation

#### Step 5: Search Radius
- **Radius Slider**: Visual slider for setting match distance (1-500 miles)
- **Live Updates**: Real-time value display

#### Step 6: Review
- **Summary**: Complete profile overview
- **Final Submission**: Save profile data

## Technical Implementation

### Component Structure

```
src/
├── components/
│   ├── ProfileEditor.tsx      # Main multi-step form
│   └── AvatarUpload.tsx        # Avatar upload component
├── pages/
│   └── Profile.tsx             # Profile page wrapper
├── utils/
│   ├── api.ts                  # API utility functions
│   └── validation.ts           # Form validation functions
└── tests/
    ├── ProfileEditor.test.tsx  # Component tests
    ├── api.test.ts             # API tests
    └── validation.test.ts      # Validation tests
```

### Key Technologies
- **React 18**: Component framework with hooks
- **TypeScript**: Type safety and better development experience
- **TailwindCSS**: Utility-first styling
- **React Router**: Navigation and routing
- **Vitest**: Testing framework
- **Testing Library**: Component testing utilities

### API Integration

#### Profile Endpoints
- `GET /api/profile` - Fetch current user profile
- `PUT /api/profile` - Update profile information
- `POST /api/profile/location` - Update location coordinates

#### Hobbies Endpoint
- `GET /api/hobbies` - Fetch available hobbies (with optional category filter)

### Form Validation

Comprehensive validation with real-time feedback:

#### Validation Functions
- `validateDisplayName()` - Name presence and length
- `validateAge()` - Age range (18-120)
- `validateBio()` - Bio length (max 500)
- `validatePronouns()` - Pronouns presence and length
- `validateGender()` - Valid gender option
- `validateLocation()` - Coordinate ranges
- `validateRadius()` - Radius range (1-500)
- `validateStatus()` - Valid status option

#### Error Handling
- **Client-side**: Real-time validation with user-friendly messages
- **API errors**: Graceful handling with informative feedback
- **Network errors**: Retry mechanisms and fallback options

### Accessibility Features

- **Semantic HTML**: Proper use of labels, fieldsets, and ARIA attributes
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper labeling and announcements
- **Focus Management**: Logical tab order and focus indicators
- **Error Messaging**: Clear error association with form fields

### Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: Responsive layouts for different screen sizes
- **Touch-Friendly**: Appropriate touch targets and gestures
- **Flexible Grids**: Adaptive layouts using TailwindCSS grid system

## Testing

### Test Coverage
- **Unit Tests**: Validation functions, API utilities
- **Component Tests**: Full user interaction flows
- **Integration Tests**: API integration and error handling
- **Accessibility Tests**: ARIA compliance and keyboard navigation

### Running Tests
```bash
# Run all tests
yarn test:client

# Run tests with UI
yarn workspace @monorepo/client test:ui

# Run tests with coverage
yarn workspace @monorepo/client test:coverage
```

## Usage

### Basic Implementation
```tsx
import ProfileEditor from './components/ProfileEditor';

function ProfilePage() {
  return <ProfileEditor />;
}
```

### Custom Styling
The component uses TailwindCSS classes for styling. Custom themes can be applied by modifying the utility classes or extending the TailwindCSS configuration.

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Features Used**: 
  - ES6+ features (async/await, destructuring)
  - Geolocation API
  - File API
  - CSS Grid and Flexbox

## Performance Considerations

- **Lazy Loading**: Components and API calls are optimized
- **Debounced Input**: Search and validation are debounced
- **Memoization**: Expensive computations are memoized
- **Bundle Optimization**: Tree-shaking and code splitting

## Security

- **Input Sanitization**: All user inputs are validated and sanitized
- **XSS Prevention**: Proper escaping of user-generated content
- **CSRF Protection**: API calls include proper headers
- **Data Validation**: Server-side validation as backup

## Future Enhancements

### Planned Features
- **Real-time Validation**: Live validation as user types
- **Auto-save**: Draft saving functionality
- **Profile Completion**: Progress tracking and incentives
- **Social Integration**: Import from social profiles
- **Photo Management**: Multiple photo uploads with cropping

### Technical Improvements
- **Performance Monitoring**: Add performance metrics
- **Error Tracking**: Integration with error reporting services
- **A/B Testing**: Feature flag support for testing
- **Internationalization**: Multi-language support
- **Offline Support**: Service worker implementation

## Troubleshooting

### Common Issues

#### Geolocation Not Working
- **Check HTTPS**: Geolocation requires HTTPS in production
- **Browser Permissions**: Ensure location permissions are granted
- **Fallback**: Manual location entry is always available

#### Form Validation Errors
- **Check Validation Functions**: Ensure validation logic is correct
- **Error Display**: Verify error messages are properly associated
- **API Response**: Check server-side validation matches client-side

#### Performance Issues
- **Large Hobby Lists**: Implement virtualization for large datasets
- **Image Uploads**: Add compression and optimization
- **Network Requests**: Implement proper caching strategies

### Debug Mode
Enable debug mode by setting `localStorage.debug = 'profile-editor:*'` to see detailed logging.

## Contributing

When contributing to the Profile Editor:

1. **Follow Code Style**: Use existing patterns and conventions
2. **Add Tests**: Ensure new features have test coverage
3. **Update Documentation**: Keep documentation current
4. **Accessibility**: Test with screen readers and keyboard
5. **Performance**: Consider performance implications

## License

This component is part of the larger project and follows the same licensing terms.