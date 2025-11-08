import { describe, it, expect } from 'vitest';
import {
  validateDisplayName,
  validateAge,
  validateBio,
  validatePronouns,
  validateGender,
  validateLocation,
  validateRadius,
  validateStatus,
} from '../validation';

describe('Form Validation', () => {
  describe('validateDisplayName', () => {
    it('should return error for empty name', () => {
      expect(validateDisplayName('')).toBe('Display name is required');
    });

    it('should return error for whitespace-only name', () => {
      expect(validateDisplayName('   ')).toBe('Display name is required');
    });

    it('should return error for name longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(validateDisplayName(longName)).toBe('Display name must be 50 characters or less');
    });

    it('should return null for valid name', () => {
      expect(validateDisplayName('John Doe')).toBe(null);
      expect(validateDisplayName('A')).toBe(null);
      expect(validateDisplayName('a'.repeat(50))).toBe(null);
    });
  });

  describe('validateAge', () => {
    it('should return error for empty age', () => {
      expect(validateAge('')).toBe('Age is required');
    });

    it('should return error for non-numeric age', () => {
      expect(validateAge('abc')).toBe('Age must be a valid number');
    });

    it('should return error for age under 18', () => {
      expect(validateAge('17')).toBe('You must be at least 18 years old');
    });

    it('should return error for age over 120', () => {
      expect(validateAge('121')).toBe('Please enter a valid age');
    });

    it('should return null for valid age', () => {
      expect(validateAge('18')).toBe(null);
      expect(validateAge('25')).toBe(null);
      expect(validateAge('120')).toBe(null);
    });
  });

  describe('validateBio', () => {
    it('should return error for bio longer than 500 characters', () => {
      const longBio = 'a'.repeat(501);
      expect(validateBio(longBio)).toBe('Bio must be 500 characters or less');
    });

    it('should return null for valid bio', () => {
      expect(validateBio('')).toBe(null);
      expect(validateBio('Short bio')).toBe(null);
      expect(validateBio('a'.repeat(500))).toBe(null);
    });
  });

  describe('validatePronouns', () => {
    it('should return error for empty pronouns', () => {
      expect(validatePronouns('')).toBe('Pronouns are required');
    });

    it('should return error for whitespace-only pronouns', () => {
      expect(validatePronouns('   ')).toBe('Pronouns are required');
    });

    it('should return error for pronouns longer than 50 characters', () => {
      const longPronouns = 'a'.repeat(51);
      expect(validatePronouns(longPronouns)).toBe('Pronouns must be 50 characters or less');
    });

    it('should return null for valid pronouns', () => {
      expect(validatePronouns('he/him')).toBe(null);
      expect(validatePronouns('they/them')).toBe(null);
      expect(validatePronouns('a'.repeat(50))).toBe(null);
    });
  });

  describe('validateGender', () => {
    it('should return error for empty gender', () => {
      expect(validateGender('')).toBe('Gender is required');
    });

    it('should return error for invalid gender', () => {
      expect(validateGender('invalid')).toBe('Please select a valid gender option');
    });

    it('should return null for valid gender options', () => {
      expect(validateGender('male')).toBe(null);
      expect(validateGender('female')).toBe(null);
      expect(validateGender('non-binary')).toBe(null);
      expect(validateGender('other')).toBe(null);
    });
  });

  describe('validateLocation', () => {
    it('should return error for null coordinates', () => {
      expect(validateLocation(null, null)).toBe('Location is required');
      expect(validateLocation(40.7128, null)).toBe('Location is required');
      expect(validateLocation(null, -74.0060)).toBe('Location is required');
    });

    it('should return error for invalid latitude', () => {
      expect(validateLocation(91, 0)).toBe('Latitude must be between -90 and 90');
      expect(validateLocation(-91, 0)).toBe('Latitude must be between -90 and 90');
    });

    it('should return error for invalid longitude', () => {
      expect(validateLocation(0, 181)).toBe('Longitude must be between -180 and 180');
      expect(validateLocation(0, -181)).toBe('Longitude must be between -180 and 180');
    });

    it('should return null for valid coordinates', () => {
      expect(validateLocation(40.7128, -74.0060)).toBe(null);
      expect(validateLocation(90, 180)).toBe(null);
      expect(validateLocation(-90, -180)).toBe(null);
      expect(validateLocation(0, 0)).toBe(null);
    });
  });

  describe('validateRadius', () => {
    it('should return error for radius less than 1', () => {
      expect(validateRadius(0)).toBe('Search radius must be between 1 and 500 miles');
      expect(validateRadius(-5)).toBe('Search radius must be between 1 and 500 miles');
    });

    it('should return error for radius greater than 500', () => {
      expect(validateRadius(501)).toBe('Search radius must be between 1 and 500 miles');
    });

    it('should return null for valid radius', () => {
      expect(validateRadius(1)).toBe(null);
      expect(validateRadius(25)).toBe(null);
      expect(validateRadius(500)).toBe(null);
    });
  });

  describe('validateStatus', () => {
    it('should return error for invalid status', () => {
      expect(validateStatus('invalid')).toBe('Please select a valid status option');
    });

    it('should return null for valid status options', () => {
      expect(validateStatus('active')).toBe(null);
      expect(validateStatus('inactive')).toBe(null);
      expect(validateStatus('hidden')).toBe(null);
    });
  });
});