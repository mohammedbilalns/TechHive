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
    return  /^\S+@\S+\.\S+$/.test(email)
}




export default { isValidName, isValidPhone, isValidPincode, isValidEmail}