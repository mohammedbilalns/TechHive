export const isValidName = (str) => {
    return /^[a-zA-Z0-9\s-]{3,50}$/.test(str.trim());
};

export const isValidPhone = (phone) => {
    return /^\d{10}$/.test(phone);
};

export const isValidPincode = (pincode) => {
    return /^\d{6}$/.test(pincode);
}; 