import crypto from "crypto";
import bcrypt from "bcryptjs";

const generateOTP = () => {
  return crypto.randomInt(1000, 9999).toString();
};

// utils for hashing passwords
const hashPassword = async (password, saltRounds) => {
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
};

export default { generateOTP, hashPassword };
