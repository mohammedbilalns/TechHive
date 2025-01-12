const isValidName = (str) => {
    return /^[a-zA-Z0-9\s-]{3,50}$/.test(str.trim());
};

const isValidPhone = (phone) => {
    return /^\d{10}$/.test(phone);
};

const isValidPincode = (pincode) => {
    return /^\d{6}$/.test(pincode);
};
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const isValidPassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|]/.test(password);

    return (hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar)

}


export default { isValidName, isValidPhone, isValidPincode, isValidEmail, isValidPassword }