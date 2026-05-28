import { showToast } from "/js/util.js";
import {
  attachInputListeners,
  resetErrors,
  isValidEmail,
  showError,
} from "/js/authValidator.js";
import { togglePasswordVisibility } from "/js/passwordToggle.js";

const form = document.getElementById("userlogin");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginLoader = document.getElementById("loginLoader");

// Initialize validation listeners and password toggle
attachInputListeners(["email", "password"]);
togglePasswordVisibility("password", "togglePassword");

// Clean up URL parameters
if (window.history.replaceState) {
  window.history.replaceState({}, document.title, window.location.pathname);
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  // Reset all error states
  resetErrors(["email", "password"]);

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!validateLoginData(email, password)) {
    return;
  }

  try {
    setLoadingState(loginButton, loginLoader, "Logging in...");

    const response = await axios.post("/login", {
      email,
      password,
    });

    if (response.data.success) {
      window.location.href = "/home";
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Login failed";
    showToast(errorMessage, "error");
  } finally {
    removeLoadingState(loginButton, loginLoader, "Log In");
  }
});

function validateLoginData(email, password) {
  let isValid = true;

  if (!email) {
    showError("email", "Email is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError("email", "Please enter a valid email address");
    isValid = false;
  }

  if (!password) {
    showError("password", "Password is required");
    isValid = false;
  }

  return isValid;
}

function setLoadingState(button, loader, text) {
  button.disabled = true;
  loader.classList.remove("hidden");
  button.querySelector("span").textContent = text;
}

function removeLoadingState(button, loader, text) {
  button.disabled = false;
  loader.classList.add("hidden");
  button.querySelector("span").textContent = text;
}
