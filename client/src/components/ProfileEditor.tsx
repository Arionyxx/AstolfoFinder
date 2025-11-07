import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi, hobbiesApi, ApiError } from '../utils/api';
import {
  validateDisplayName,
  validateAge,
  validateBio,
  validatePronouns,
  validateGender,
  validateLocation,
  validateRadius,
  validateStatus,
} from '../utils/validation';
import AvatarUpload from './AvatarUpload';

// Types
interface Hobby {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface ProfileData {
  displayName: string;
  pronouns: string;
  gender: string;
  age: string;
  bio: string;
  status: string;
  hobbies: string[];
  interests: string;
  locationLat: number | null;
  locationLng: number | null;
  radiusPref: number;
  avatarUrl?: string;
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'hidden', label: 'Hidden' },
];

const pronounOptions = [
  { value: 'he/him', label: 'He/Him' },
  { value: 'she/her', label: 'She/Her' },
  { value: 'they/them', label: 'They/Them' },
  { value: 'he/they', label: 'He/They' },
  { value: 'she/they', label: 'She/They' },
];

export default function ProfileEditor(): JSX.Element {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    pronouns: '',
    gender: '',
    age: '',
    bio: '',
    status: 'active',
    hobbies: [],
    interests: '',
    locationLat: null,
    locationLng: null,
    radiusPref: 25,
    avatarUrl: '',
  });
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [manualLocation, setManualLocation] = useState(false);
  const navigate = useNavigate();

  const totalSteps = 6;

  useEffect(() => {
    fetchHobbies();
    fetchCurrentProfile();
  }, []);

  const fetchHobbies = async () => {
    try {
      const data = await hobbiesApi.getHobbies();
      setHobbies(data.hobbies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hobbies');
    }
  };

  const fetchCurrentProfile = async () => {
    try {
      const data = await profileApi.getProfile();
      const profile = data.profile;
      
      setProfileData({
        displayName: profile.displayName || '',
        pronouns: profile.pronouns || '',
        gender: profile.gender || '',
        age: profile.age?.toString() || '',
        bio: profile.bio || '',
        status: profile.status || 'active',
        hobbies: profile.hobbies?.map((h: Hobby) => h.id) || [],
        interests: profile.interests || '',
        locationLat: profile.locationLat || null,
        locationLng: profile.locationLng || null,
        radiusPref: profile.radiusPref || 25,
        avatarUrl: profile.avatarUrl || '',
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Profile doesn't exist yet, that's okay
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfileData(prev => ({
          ...prev,
          locationLat: position.coords.latitude,
          locationLng: position.coords.longitude,
        }));
        setLocationLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location. Please enter manually.');
        setManualLocation(true);
        setLocationLoading(false);
      }
    );
  };

  const handleAvatarChange = (avatarUrl: string) => {
    setProfileData(prev => ({
      ...prev,
      avatarUrl,
    }));
  };

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHobbyToggle = (hobbyId: string) => {
    setProfileData(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobbyId)
        ? prev.hobbies.filter(id => id !== hobbyId)
        : [...prev.hobbies, hobbyId],
    }));
  };

  const validateStep = (): boolean => {
    setError(null);
    
    switch (currentStep) {
      case 1: // Basic Info
        const nameError = validateDisplayName(profileData.displayName);
        const pronounsError = validatePronouns(profileData.pronouns);
        const genderError = validateGender(profileData.gender);
        const ageError = validateAge(profileData.age);
        
        if (nameError) setError(nameError);
        else if (pronounsError) setError(pronounsError);
        else if (genderError) setError(genderError);
        else if (ageError) setError(ageError);
        
        return !nameError && !pronounsError && !genderError && !ageError;
        
      case 2: // Bio
        const bioError = validateBio(profileData.bio);
        if (bioError) setError(bioError);
        return !bioError;
        
      case 3: // Hobbies
        return true; // Hobbies are optional
        
      case 4: // Location
        const locationError = validateLocation(profileData.locationLat, profileData.locationLng);
        if (locationError) setError(locationError);
        return !locationError;
        
      case 5: // Radius
        const radiusError = validateRadius(profileData.radiusPref);
        if (radiusError) setError(radiusError);
        return !radiusError;
        
      case 6: // Review
        return true;
        
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      setError('Please fill in all required fields correctly');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await profileApi.updateProfile({
        displayName: profileData.displayName,
        pronouns: profileData.pronouns,
        gender: profileData.gender,
        age: parseInt(profileData.age),
        bio: profileData.bio,
        status: profileData.status,
        hobbies: profileData.hobbies,
        locationLat: profileData.locationLat,
        locationLng: profileData.locationLng,
        radiusPref: profileData.radiusPref,
      });

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
            
            <AvatarUpload
              onAvatarChange={handleAvatarChange}
              currentAvatar={profileData.avatarUrl}
            />
            
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                value={profileData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
                required
              />
              <p className="text-sm text-gray-500 mt-1">This is how others will see you</p>
            </div>

            <div>
              <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700 mb-2">
                Pronouns *
              </label>
              <select
                id="pronouns"
                value={profileData.pronouns}
                onChange={(e) => handleInputChange('pronouns', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select pronouns</option>
                {pronounOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Custom pronouns"
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender Identity *
              </label>
              <select
                id="gender"
                value={profileData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select gender</option>
                {genderOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                id="age"
                value={profileData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="18"
                max="120"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">About You</h2>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                maxLength={500}
                placeholder="Tell us about yourself..."
              />
              <p className="text-sm text-gray-500 mt-1">
                {profileData.bio.length}/500 characters
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Profile Status
              </label>
              <select
                id="status"
                value={profileData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Hobbies & Interests</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select your hobbies (choose as many as you like)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {hobbies.map(hobby => (
                  <label
                    key={hobby.id}
                    className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={profileData.hobbies.includes(hobby.id)}
                      onChange={() => handleHobbyToggle(hobby.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{hobby.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Interests
              </label>
              <textarea
                id="interests"
                value={profileData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Any other interests or hobbies you'd like to share..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Location</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Set your location for matching
              </label>
              
              {!manualLocation ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {locationLoading ? 'Getting location...' : 'Use my current location'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setManualLocation(true)}
                    className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Enter location manually
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        id="latitude"
                        value={profileData.locationLat || ''}
                        onChange={(e) => handleInputChange('locationLat', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="any"
                        min="-90"
                        max="90"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        id="longitude"
                        value={profileData.locationLng || ''}
                        onChange={(e) => handleInputChange('locationLng', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="any"
                        min="-180"
                        max="180"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setManualLocation(false)}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Back to automatic location
                  </button>
                </div>
              )}
              
              {profileData.locationLat && profileData.locationLng && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">
                    ✓ Location set: {profileData.locationLat.toFixed(6)}, {profileData.locationLng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Search Radius</h2>
            
            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum distance for matches: {profileData.radiusPref} miles
              </label>
              <input
                type="range"
                id="radius"
                value={profileData.radiusPref}
                onChange={(e) => handleInputChange('radiusPref', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                min="1"
                max="500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 mile</span>
                <span>100 miles</span>
                <span>500 miles</span>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Review Your Profile</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Basic Info</h3>
                <p><strong>Name:</strong> {profileData.displayName}</p>
                <p><strong>Pronouns:</strong> {profileData.pronouns}</p>
                <p><strong>Gender:</strong> {genderOptions.find(g => g.value === profileData.gender)?.label}</p>
                <p><strong>Age:</strong> {profileData.age}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">Bio</h3>
                <p className="text-gray-700">{profileData.bio || 'No bio provided'}</p>
                <p><strong>Status:</strong> {statusOptions.find(s => s.value === profileData.status)?.label}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">Hobbies</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.hobbies.length > 0 ? (
                    profileData.hobbies.map(hobbyId => {
                      const hobby = hobbies.find(h => h.id === hobbyId);
                      return hobby ? (
                        <span key={hobbyId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {hobby.name}
                        </span>
                      ) : null;
                    })
                  ) : (
                    <span className="text-gray-500">No hobbies selected</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">Location & Preferences</h3>
                <p><strong>Location:</strong> {profileData.locationLat && profileData.locationLng 
                  ? `${profileData.locationLat.toFixed(6)}, ${profileData.locationLng.toFixed(6)}`
                  : 'Not set'}</p>
                <p><strong>Search Radius:</strong> {profileData.radiusPref} miles</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Profile</h1>
          <span className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-8">
        {renderStep()}
        
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep === totalSteps ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}