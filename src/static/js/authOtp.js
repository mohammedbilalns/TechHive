import { hideAlertMessage, setAlertMessage } from "/js/formFeedback.js";

function setupOtpInputs(selector = ".otp-input") {
  const otpInputs = Array.from(document.querySelectorAll(selector));

  otpInputs.forEach((input, index) => {
    input.addEventListener("input", (event) => {
      const current = event.target;
      const next = otpInputs[index + 1];
      current.value = current.value.replace(/[^0-9]/g, "");

      if (current.value.length === 1 && next) {
        next.focus();
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Backspace") return;

      const previous = otpInputs[index - 1];
      if (input.value === "" && previous) {
        event.preventDefault();
        previous.value = "";
        previous.focus();
        return;
      }

      input.value = "";
    });
  });

  return otpInputs;
}

function createOtpFlow({
  modalId,
  emailTargetId,
  hiddenEmailId,
  timerId,
  warningId,
  resendButtonId,
  alertId,
  verifyButtonId,
  otpSelector = ".otp-input",
  durationSeconds = 60,
}) {
  const modal = document.getElementById(modalId);
  const emailTarget = document.getElementById(emailTargetId);
  const hiddenEmail = hiddenEmailId
    ? document.getElementById(hiddenEmailId)
    : null;
  const timer = document.getElementById(timerId);
  const warning = document.getElementById(warningId);
  const resendButton = document.getElementById(resendButtonId);
  const verifyButton = verifyButtonId
    ? document.getElementById(verifyButtonId)
    : null;
  const otpInputs = Array.from(document.querySelectorAll(otpSelector));

  let timeLeft = durationSeconds;
  let countdownTimer = null;

  function formatTime(secondsLeft) {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  function setInputsDisabled(disabled) {
    otpInputs.forEach((input) => {
      input.disabled = disabled;
    });
  }

  function clearFields() {
    otpInputs.forEach((input) => {
      input.value = "";
    });

    if (otpInputs[0]) {
      otpInputs[0].focus();
    }
  }

  function stopTimer() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function startTimer() {
    stopTimer();
    timeLeft = durationSeconds;
    resendButton.disabled = true;
    resendButton.style.cursor = "not-allowed";

    if (verifyButton) {
      verifyButton.disabled = false;
      verifyButton.classList.remove("opacity-50", "cursor-not-allowed");
    }

    warning.style.display = "none";
    timer.style.display = "block";
    timer.textContent = `You can resend OTP in: ${formatTime(timeLeft)}`;

    countdownTimer = setInterval(() => {
      timeLeft -= 1;
      timer.textContent = `You can resend OTP in: ${formatTime(timeLeft)}`;

      if (timeLeft > 0) return;

      stopTimer();
      resendButton.disabled = false;
      resendButton.style.cursor = "pointer";
      setInputsDisabled(true);

      if (verifyButton) {
        verifyButton.disabled = true;
        verifyButton.classList.add("opacity-50", "cursor-not-allowed");
      }

      warning.style.display = "block";
      timer.style.display = "none";
    }, 1000);
  }

  function show(email) {
    modal.classList.replace("hidden", "flex");
    emailTarget.textContent = email;
    if (hiddenEmail) {
      hiddenEmail.value = email;
    }

    hideAlertMessage(alertId);
    clearFields();
    setInputsDisabled(false);
    startTimer();
  }

  function close() {
    modal.classList.replace("flex", "hidden");
    stopTimer();
    clearFields();
    setInputsDisabled(false);
    warning.style.display = "none";
    timer.style.display = "block";
    hideAlertMessage(alertId);
  }

  function showAlert(message, type = "error") {
    setAlertMessage(alertId, message, type);
  }

  function getOtp() {
    return otpInputs.map((input) => input.value).join("");
  }

  function getEmail() {
    return hiddenEmail ? hiddenEmail.value : emailTarget.textContent;
  }

  function getTimeLeft() {
    return timeLeft;
  }

  return {
    clearFields,
    close,
    getEmail,
    getOtp,
    getTimeLeft,
    otpInputs,
    show,
    showAlert,
    startTimer,
    stopTimer,
  };
}

export { createOtpFlow, setupOtpInputs };
