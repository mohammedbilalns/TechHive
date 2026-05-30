import {
  attachInputListeners,
  isStrongPassword,
  isValidEmail,
  resetErrors,
  showError,
} from "/js/authValidator.js";
import { togglePasswordVisibility } from "/js/passwordToggle.js";
import { createOtpFlow, setupOtpInputs } from "/js/authOtp.js";
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

function createForgotPasswordPage() {
  setupOtpInputs(".otp-input");
  const otpFlow = createOtpFlow({
    modalId: "otpModal",
    emailTargetId: "otpEmail",
    timerId: "timer",
    warningId: "warningMessage",
    resendButtonId: "resendButton",
    alertId: "otpAlertMessage",
    verifyButtonId: "verifyOtpButton",
  });

  async function requestOtp(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    if (!email) {
      showError("email", "Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      showError("email", "Please enter a valid email address");
      return;
    }

    try {
      setButtonLoading("submitButton", "submitLoader", "Sending...", true);
      const response = await axios.post("/auth/forgot-password", { email });
      if (response.data.success) {
        otpFlow.show(email);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setButtonLoading("submitButton", "submitLoader", "Send Reset OTP", false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();

    try {
      setButtonLoading("verifyOtpButton", "verifyLoader", "Verifying...", true);
      const otp = otpFlow.getOtp();

      const response = await axios.post("/auth/verify-forgot-password-otp", {
        otp1: otp[0],
        otp2: otp[1],
        otp3: otp[2],
        otp4: otp[3],
      });

      if (response.data.success) {
        document.getElementById("otpModal").classList.replace("flex", "hidden");
        document
          .getElementById("resetPasswordModal")
          .classList.replace("hidden", "flex");
      }
    } catch (error) {
      otpFlow.clearFields();
      otpFlow.showAlert(
        error.response?.data?.message || "Verification failed",
        "error",
      );

      if (error.response?.data?.maxAttemptsExceeded) {
        otpFlow.close();
        showToast("Maximum attempts exceeded. Please try again.", "error");
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
      const response = await axios.post("/auth/resend-forgot-password-otp");

      if (response.data.success) {
        otpFlow.clearFields();
        otpFlow.startTimer();
        otpFlow.showAlert("OTP sent successfully", "success");
      }
    } catch (error) {
      otpFlow.showAlert(
        error.response?.data?.message || "Failed to resend OTP",
        "error",
      );
    } finally {
      setInlineButtonState("resendButton", "resendLoader", "Resend OTP", false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    resetErrors(["newPassword", "confirmPassword"]);

    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    let hasError = false;
    if (!newPassword) {
      showError("newPassword", "Password is required");
      hasError = true;
    } else if (!isStrongPassword(newPassword)) {
      showError(
        "newPassword",
        "Password must contain at least 8 characters, including uppercase, lowercase letters, numbers, and special characters",
      );
      hasError = true;
    }

    if (!confirmPassword) {
      showError("confirmPassword", "Please confirm your password");
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      showError("confirmPassword", "Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    try {
      setButtonLoading(
        "resetPasswordButton",
        "resetLoader",
        "Resetting...",
        true,
      );
      const response = await axios.patch("/auth/reset-password", {
        password: newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        window.location.href =
          "/auth/login?message=Password+reset+successful&alertType=success";
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to reset password",
        "error",
      );
    } finally {
      setButtonLoading(
        "resetPasswordButton",
        "resetLoader",
        "Reset Password",
        false,
      );
    }
  }

  attachInputListeners(["email", "newPassword", "confirmPassword"]);
  togglePasswordVisibility("newPassword", "toggleNewPassword");
  togglePasswordVisibility("confirmPassword", "toggleConfirmPassword");

  document
    .getElementById("forgotPasswordForm")
    .addEventListener("submit", requestOtp);
  document.getElementById("otpForm").addEventListener("submit", verifyOtp);
  document.getElementById("resendButton").addEventListener("click", resendOtp);
  document
    .getElementById("resetPasswordForm")
    .addEventListener("submit", resetPassword);
}

export { createForgotPasswordPage };
