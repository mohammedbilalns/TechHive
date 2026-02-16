import { isValidName, isValidEmail, isValidPassword, isValidPhone } from "../utils/validations.js";

export const validateLogin = ({ email, password }) => {
  email = email.trim();
  password = password.trim();

  if (!email.trim() || !password.trim()) {
    return "Email and password are required";
  }

  if (!isValidEmail(email)) {
    return "Enter a valid email address";
  }

  return null

}

export const validateRegister = ({ fullname, phonenumber, email, password, confirmPassword }) => {
  fullname = fullname.trim();
  phonenumber = phonenumber.trim();
  email = email.trim();
  password = password.trim();
  confirmPassword = confirmPassword.trim();


  if (!fullname || !phonenumber || !email || !password || !confirmPassword) {
    return "All fields are required";
  }

  if (!isValidName(fullname)) return "Full name should containe only alphabets (3-30 characters)";
  if (!isValidPhone(phonenumber)) return "Phone number must be 10 digits";
  if (!isValidEmail(email)) return "Please enter a valid email address";
  if (!isValidPassword(password)) return "Password must contain 8+ characters with uppercase, lowercase, number, and special character";
  if (password !== confirmPassword) return "Passwords do not match";

  return null
}


export const validateResetPassword = ({ email, password, confirmPassword }) => {
  email = email.trim();
  password = password.trim();
  confirmPassword = confirmPassword.trim();

  if (!email || !password || !confirmPassword) {
    return "All fields are required";
  }

  if (!isValidEmail(email)) return "Please enter a valid email address";
  if (!isValidPassword(password)) return "Password must contain 8+ characters with uppercase, lowercase, number, and special character";
  if (password !== confirmPassword) return "Passwords do not match";

  return null
}
