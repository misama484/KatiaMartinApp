/**
 * Generates a random password that meets security requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function generateRandomPassword(): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';
  
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
  // Ensure at least one of each character type
  let password = 
    uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length)) +
    lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length)) +
    numberChars.charAt(Math.floor(Math.random() * numberChars.length)) +
    specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Add additional random characters to reach the desired length (12 characters)
  const remainingLength = 8;
  for (let i = 0; i < remainingLength; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Checks if a password meets the security requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one number
 */
export function isPasswordValid(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true, message: 'Password is valid' };
}

/**
 * Calculates the strength of a password
 * Returns a value between 0 and 100
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length contribution (up to 40 points)
  strength += Math.min(password.length * 4, 40);
  
  // Character variety contribution (up to 60 points)
  if (/[A-Z]/.test(password)) strength += 15; // Uppercase
  if (/[a-z]/.test(password)) strength += 10; // Lowercase
  if (/[0-9]/.test(password)) strength += 15; // Numbers
  if (/[^A-Za-z0-9]/.test(password)) strength += 20; // Special characters
  
  return Math.min(strength, 100);
}

/**
 * Returns a color and label based on password strength
 */
export function getPasswordStrengthInfo(strength: number): { color: string; label: string } {
  if (strength < 30) {
    return { color: 'bg-red-500', label: 'Very Weak' };
  } else if (strength < 50) {
    return { color: 'bg-orange-500', label: 'Weak' };
  } else if (strength < 75) {
    return { color: 'bg-yellow-500', label: 'Medium' };
  } else if (strength < 90) {
    return { color: 'bg-green-500', label: 'Strong' };
  } else {
    return { color: 'bg-green-600', label: 'Very Strong' };
  }
}