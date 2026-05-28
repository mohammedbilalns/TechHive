// Validates name: 3-50 chars, allows letters, digits, spaces, and hyphens
export const isValidName = (str) => {
  return /^[a-zA-Z0-9\s-]{3,50}$/.test(str.trim());
};

// Validates 10-digit phone number
export const isValidPhone = (phone) => {
  return /^\d{10}$/.test(phone);
};

// Validates 6-digit pincode
export const isValidPincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

// Validates email format
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Validates password: min 8 chars, upper, lower, digit, and special char required
export const isValidPassword = (password) => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|]/.test(password);
  return (
    hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
  );
};
