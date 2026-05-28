export const validateAdminLogin = ({ email, password }) => {
  email = email?.trim();
  password = password?.trim();

  if (!email) {
    return "Email is required";
  }

  if (!password) {
    return "Password is required";
  }

  return null;
};
