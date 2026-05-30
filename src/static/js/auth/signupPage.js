import {
  attachInputListeners,
  isStrongPassword,
  isValidEmail,
  isValidName,
  isValidPhone,
  resetErrors,
  showError,
} from "/js/authValidator.js";
import { togglePasswordVisibility } from "/js/passwordToggle.js";
import { createOtpFlow, setupOtpInputs } from "/js/authOtp.js";
import { hideAlertMessage, setAlertMessage } from "/js/formFeedback.js";
import { showToast } from "/js/util.js";

function setButtonLoading(buttonId, loaderId, text, loading) {
  const button = document.getElementById(buttonId);
  const loader = document.getElementById(loaderId);
  const textElement = button.querySelector("span");
  textElement.textContent = text;
  loader.classList.toggle("hidden", !loading);
  button.disabled = loading;
}

function setInlineButtonState(buttonId, loaderId, text, loading) {
  const button = document.getElementById(buttonId);
  const loader = document.getElementById(loaderId);
  const textElement = button.querySelector("span");
  textElement.textContent = text;
  loader.classList.toggle("hidden", !loading);
}

function createSignupPage() {
  const otpInputs = setupOtpInputs(".otp-input");
  const otpFlow = createOtpFlow({
    modalId: "otpModal",
    emailTargetId: "otpEmail",
    timerId: "timer",
    warningId: "warningMessage",
    resendButtonId: "resendButton",
    alertId: "otpAlertMessage",
    verifyButtonId: "verifyOtpButton",
  });

  function closeOtpModal() {
    otpFlow.close();
    document.getElementById("signupForm").reset();
  }

  async function submitSignupForm(event) {
    event.preventDefault();
    resetErrors([
      "fullname",
      "phonenumber",
      "email",
      "password",
      "confirmPassword",
    ]);

    const fullname = document.getElementById("fullname").value.trim();
    const phonenumber = document.getElementById("phonenumber").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    let hasError = false;

    if (!fullname) {
      showError("fullname", "Full name is required");
      hasError = true;
    } else if (!isValidName(fullname)) {
      showError(
        "fullname",
        "Full name should contain only alphabets (3-30 characters)",
      );
      hasError = true;
    }

    if (!phonenumber) {
      showError("phonenumber", "Phone number is required");
      hasError = true;
    } else if (!isValidPhone(phonenumber)) {
      showError("phonenumber", "Phone number must be 10 digits");
      hasError = true;
    }

    if (!email) {
      showError("email", "Email is required");
      hasError = true;
    } else if (!isValidEmail(email)) {
      showError("email", "Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      showError("password", "Password is required");
      hasError = true;
    } else if (!isStrongPassword(password)) {
      showError(
        "password",
        "Password must contain at least 8 characters, including uppercase, lowercase letters, numbers, and special characters",
      );
      hasError = true;
    }

    if (!confirmPassword) {
      showError("confirmPassword", "Please confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      showError("confirmPassword", "Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    try {
      setButtonLoading("signupButton", "signupLoader", "Signing up...", true);
      const response = await axios.post("/auth/signup", {
        fullname,
        phonenumber,
        email,
        password,
        confirmPassword,
      });

      if (response.data.success) {
        otpFlow.show(response.data.email);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Signup failed", "error");
    } finally {
      setButtonLoading("signupButton", "signupLoader", "Sign Up", false);
    }
  }

  async function verifyOtp() {
    try {
      setButtonLoading("verifyOtpButton", "verifyLoader", "Verifying...", true);
      const otp = otpFlow.getOtp();
      const response = await axios.post("/auth/verify-otp", {
        otp1: otp[0],
        otp2: otp[1],
        otp3: otp[2],
        otp4: otp[3],
        email: document.getElementById("otpEmail").textContent,
        timeRem: otpFlow.getTimeLeft(),
      });

      if (response.data.success) {
        document.getElementById("otpModal").classList.replace("flex", "hidden");
        document
          .getElementById("referralModal")
          .classList.replace("hidden", "flex");
      }
    } catch (error) {
      otpFlow.showAlert(
        error.response?.data?.message || "Verification failed",
        "error",
      );
      otpFlow.clearFields();

      if (error.response?.data?.maxAttemptsExceeded) {
        closeOtpModal();
        showToast("Maximum attempts exceeded. Please sign up again.", "error");
      }
    } finally {
      setInlineButtonState(
        "verifyOtpButton",
        "verifyLoader",
        "Verify Code",
        false,
      );
    }
  }

  async function resendOtp() {
    try {
      document.getElementById("resendButton").disabled = true;
      setInlineButtonState("resendButton", "resendLoader", "Sending...", true);
      const response = await axios.post("/auth/resend-otp", {
        email: document.getElementById("otpEmail").textContent,
      });

      if (response.data.success) {
        otpFlow.clearFields();
        otpFlow.startTimer();
        otpInputs.forEach((input) => {
          input.disabled = false;
        });
        otpFlow.showAlert(response.data.message, "success");
      }
    } catch (error) {
      otpFlow.showAlert(
        error.response?.data?.message || "Failed to resend OTP",
        "error",
      );
      if (error.response?.data?.maxAttemptsExceeded) {
        closeOtpModal();
        showToast(
          "Maximum resend attempts exceeded. Please sign up again.",
          "error",
        );
      }
    } finally {
      setInlineButtonState("resendButton", "resendLoader", "Resend OTP", false);
    }
  }

  async function applyReferral() {
    const code = document
      .getElementById("referralCode")
      .value.trim()
      .toUpperCase();
    if (!code) {
      setAlertMessage(
        "referralAlertMessage",
        "Please enter a referral code",
        "error",
      );
      return;
    }

    try {
      setButtonLoading("applyReferral", "referralLoader", "Applying...", true);
      const response = await axios.post("/auth/apply-referral", {
        referralCode: code,
      });
      if (response.data.success) {
        window.location.href = "/home";
      }
    } catch (error) {
      setAlertMessage(
        "referralAlertMessage",
        error.response?.data?.message || "Failed to apply referral code",
        "error",
      );
    } finally {
      setButtonLoading("applyReferral", "referralLoader", "Apply", false);
    }
  }

  attachInputListeners([
    "fullname",
    "phonenumber",
    "email",
    "password",
    "confirmPassword",
  ]);
  togglePasswordVisibility("password", "togglePassword");
  togglePasswordVisibility("confirmPassword", "toggleConfirmPassword");

  document
    .getElementById("signupForm")
    .addEventListener("submit", submitSignupForm);
  document
    .getElementById("verifyOtpButton")
    .addEventListener("click", verifyOtp);
  document.getElementById("resendButton").addEventListener("click", resendOtp);
  document.getElementById("skipReferral").addEventListener("click", () => {
    window.location.href = "/home";
  });
  document
    .getElementById("applyReferral")
    .addEventListener("click", applyReferral);
  document
    .getElementById("referralCode")
    .addEventListener("input", () => hideAlertMessage("referralAlertMessage"));
}

export { createSignupPage };
