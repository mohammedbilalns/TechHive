import { UserModel } from "../model/userModel.js";

// Generates a random 8-character alphanumeric referral code
const  generateReferralCode = ()=> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}; 

// Generates a unique referral code by retrying until no existing user has it
export async function generateUniqueReferralCode() {
  let referralCode;
  let isUnique = false;
  while (!isUnique) {
    referralCode = generateReferralCode();
    const existingUserWithCode = await UserModel.findOne({ referralCode });
    if (!existingUserWithCode) {
      isUnique = true;
    }
  }
  return referralCode;
}


export default {generateReferralCode};
