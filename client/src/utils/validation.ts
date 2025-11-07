// Form validation utilities
export const validateDisplayName = (name: string): string | null => {
  if (!name.trim()) {
    return 'Display name is required';
  }
  if (name.length > 50) {
    return 'Display name must be 50 characters or less';
  }
  return null;
};

export const validateAge = (age: string): string | null => {
  const ageNum = parseInt(age);
  if (!age.trim()) {
    return 'Age is required';
  }
  if (isNaN(ageNum)) {
    return 'Age must be a valid number';
  }
  if (ageNum < 18) {
    return 'You must be at least 18 years old';
  }
  if (ageNum > 120) {
    return 'Please enter a valid age';
  }
  return null;
};

export const validateBio = (bio: string): string | null => {
  if (bio.length > 500) {
    return 'Bio must be 500 characters or less';
  }
  return null;
};

export const validatePronouns = (pronouns: string): string | null => {
  if (!pronouns.trim()) {
    return 'Pronouns are required';
  }
  if (pronouns.length > 50) {
    return 'Pronouns must be 50 characters or less';
  }
  return null;
};

export const validateGender = (gender: string): string | null => {
  if (!gender) {
    return 'Gender is required';
  }
  const validGenders = ['male', 'female', 'non-binary', 'other'];
  if (!validGenders.includes(gender)) {
    return 'Please select a valid gender option';
  }
  return null;
};

export const validateLocation = (lat: number | null, lng: number | null): string | null => {
  if (lat === null || lng === null) {
    return 'Location is required';
  }
  if (lat < -90 || lat > 90) {
    return 'Latitude must be between -90 and 90';
  }
  if (lng < -180 || lng > 180) {
    return 'Longitude must be between -180 and 180';
  }
  return null;
};

export const validateRadius = (radius: number): string | null => {
  if (radius < 1 || radius > 500) {
    return 'Search radius must be between 1 and 500 miles';
  }
  return null;
};

export const validateStatus = (status: string): string | null => {
  const validStatuses = ['active', 'inactive', 'hidden'];
  if (!validStatuses.includes(status)) {
    return 'Please select a valid status option';
  }
  return null;
};