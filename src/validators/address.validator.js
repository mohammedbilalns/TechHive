import { isValidPhone, isValidPincode } from "../utils/validations.js";

export const validateAddAddress = ({name, houseName, localityStreet, city, state, pincode, phone}) => {

  name = name.trim();
  houseName = houseName.trim();
  localityStreet = localityStreet.trim();
  city = city.trim();
  state = state.trim();
  pincode = pincode.trim();
  phone = phone.trim();


  if (!name || !houseName || !localityStreet || !city || !state || !pincode || !phone) {
    return "Missing required fields";
  }

  if (name.length < 3 || name.length > 50) {
    return "Name must be between 3 and 50 characters";
  }

  if (houseName.length < 3 || houseName.length > 50) {
    return "House name must be between 3 and 50 characters";
  }

  if (localityStreet.length < 3 || localityStreet.length > 50) {
    return "Locality/Street must be between 3 and 50 characters";
  }

  if (city.length < 3 || city.length > 50) return 'City must be between 3 and 50 characters';

  if(!isValidPincode(pincode)) return "Please enter a valid pincode";

  if(!isValidPhone(phone)) return "Please enter a 10-digit valid Phone number";
};
