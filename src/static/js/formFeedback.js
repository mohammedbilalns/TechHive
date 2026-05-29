function showFieldError(fieldId, message, errorSuffix = "Error") {
  const input = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}${errorSuffix}`);

  if (input) {
    input.classList.add("border-red-500");
  }

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }
}

function clearFieldError(fieldId, errorSuffix = "Error") {
  const input = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}${errorSuffix}`);

  if (input) {
    input.classList.remove("border-red-500");
  }

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  }
}

function resetFormErrors(formId, errorSuffix = "Error") {
  const form = document.getElementById(formId);
  if (!form) return;

  form.querySelectorAll("input, select, textarea").forEach((input) => {
    if (input.id) {
      clearFieldError(input.id, errorSuffix);
    }
  });
}

function attachFieldClearHandlers(fieldIds, errorSuffix = "Error") {
  fieldIds.forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (!element) return;

    element.addEventListener("input", () =>
      clearFieldError(fieldId, errorSuffix),
    );
  });
}

function setAlertMessage(elementId, message, type = "error") {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.classList.remove(
    "hidden",
    "bg-red-100",
    "text-red-700",
    "bg-green-100",
    "text-green-700",
  );
  element.classList.add(type === "error" ? "bg-red-100" : "bg-green-100");
  element.classList.add(type === "error" ? "text-red-700" : "text-green-700");
}

function hideAlertMessage(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = "";
  element.classList.add("hidden");
}

export {
  attachFieldClearHandlers,
  clearFieldError,
  hideAlertMessage,
  resetFormErrors,
  setAlertMessage,
  showFieldError,
};
