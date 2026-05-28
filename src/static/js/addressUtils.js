function getErrorId(fieldName, formType) {
  return `${formType}${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}Error`;
}

function resetAddressForm(formId, formType) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.reset();
  resetErrors(formType);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeModal(modalId, formId, formType) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
  resetAddressForm(formId, formType);
}

function toggleModal(modalId, formId, formType) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  if (modal.classList.contains("hidden")) {
    openModal(modalId);
    return;
  }

  closeModal(modalId, formId, formType);
}

function showError(fieldName, message, formType) {
  const input = document.querySelector(
    `#${formType}AddressForm [name="${fieldName}"]`,
  );
  const errorElement = document.getElementById(getErrorId(fieldName, formType));

  if (!input || !errorElement) return;

  input.classList.add("border-red-500");
  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
}

function resetErrors(formType) {
  const form = document.getElementById(`${formType}AddressForm`);
  if (!form) return;

  form.querySelectorAll("input, select").forEach((input) => {
    input.classList.remove("border-red-500");
    const errorElement = document.getElementById(
      getErrorId(input.name, formType),
    );
    if (!errorElement) return;

    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  });
}

function normalizeAddressData(rawData) {
  return {
    ...rawData,
    name: rawData.name?.trim() || "",
    houseName: rawData.houseName?.trim() || "",
    localityStreet: rawData.localityStreet?.trim() || "",
    city: rawData.city?.trim() || "",
    state: rawData.state || "",
    pincode: rawData.pincode?.trim() || "",
    phone: rawData.phone?.trim() || "",
    alternatePhone: rawData.alternatePhone?.trim() || "",
  };
}

function validateAddressData(rawData, formType) {
  const data = normalizeAddressData(rawData);
  let hasError = false;

  const textFields = [
    ["name", "Name"],
    ["houseName", "House name"],
    ["localityStreet", "Locality/Street"],
    ["city", "City"],
  ];

  textFields.forEach(([fieldName, label]) => {
    if (!data[fieldName]) {
      showError(fieldName, `${label} is required`, formType);
      hasError = true;
    } else if (data[fieldName].length < 3 || data[fieldName].length > 50) {
      showError(
        fieldName,
        `${label} must be between 3 and 50 characters`,
        formType,
      );
      hasError = true;
    }
  });

  if (!data.state) {
    showError("state", "Please select a state", formType);
    hasError = true;
  }

  if (!data.pincode) {
    showError("pincode", "Pincode is required", formType);
    hasError = true;
  } else if (!/^\d{6}$/.test(data.pincode)) {
    showError("pincode", "Please enter a valid 6-digit pincode", formType);
    hasError = true;
  }

  if (!data.phone) {
    showError("phone", "Phone number is required", formType);
    hasError = true;
  } else if (!/^\d{10}$/.test(data.phone)) {
    showError("phone", "Please enter a valid 10-digit phone number", formType);
    hasError = true;
  }

  if (data.alternatePhone && !/^\d{10}$/.test(data.alternatePhone)) {
    showError(
      "alternatePhone",
      "Please enter a valid 10-digit alternate phone number",
      formType,
    );
    hasError = true;
  }

  if (hasError) return null;

  return data;
}

function readAddressForm(formId) {
  const form = document.getElementById(formId);
  return Object.fromEntries(new FormData(form).entries());
}

function populateAddressForm(formId, address) {
  const form = document.getElementById(formId);
  if (!form) return;

  Object.entries(address).forEach(([key, value]) => {
    const field = form.querySelector(`[name="${key}"]`);
    if (field) {
      field.value = value || "";
    }
  });
}

function bindAddressFormInputs(formType) {
  const form = document.getElementById(`${formType}AddressForm`);
  if (!form || form.dataset.addressBound === "true") return;

  form.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("border-red-500");
      const errorElement = document.getElementById(
        getErrorId(input.name, formType),
      );
      if (!errorElement) return;

      errorElement.textContent = "";
      errorElement.classList.add("hidden");
    });
  });

  form.dataset.addressBound = "true";
}

function attachModalBackdropClose(modalId, onClose) {
  const modal = document.getElementById(modalId);
  if (!modal || modal.dataset.backdropBound === "true") return;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      onClose();
    }
  });

  modal.dataset.backdropBound = "true";
}

export {
  attachModalBackdropClose,
  bindAddressFormInputs,
  closeModal,
  openModal,
  populateAddressForm,
  readAddressForm,
  resetErrors,
  showError,
  toggleModal,
  validateAddressData,
};
