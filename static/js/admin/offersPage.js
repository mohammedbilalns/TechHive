import {
  attachFieldClearHandlers,
  resetFormErrors,
  showFieldError,
} from "/js/formFeedback.js";
import { customConfirm, showToast } from "/js/util.js";

const OFFER_FIELDS = [
  "name",
  "offerType",
  "offerPercentage",
  "categories",
  "products",
  "startDate",
  "endDate",
];

function createOffersPage({ currentPage = 1 } = {}) {
  const offerModal = document.getElementById("offerModal");
  const offerForm = document.getElementById("offerForm");
  const referralForm = document.getElementById("referralForm");
  const offerTypeSelect = document.getElementById("offerType");

  function handleOfferTypeChange() {
    const isCategory = offerTypeSelect.value === "category";
    document
      .getElementById("categorySelect")
      .classList.toggle("hidden", !isCategory);
    document
      .getElementById("productSelect")
      .classList.toggle("hidden", isCategory);

    if (isCategory) {
      Array.from(document.getElementById("products").options).forEach(
        (option) => {
          option.selected = false;
        },
      );
    } else {
      Array.from(document.getElementById("categories").options).forEach(
        (option) => {
          option.selected = false;
        },
      );
    }
  }

  function openModal() {
    offerModal.classList.remove("hidden");
    offerModal.classList.add("flex");
  }

  function closeModal() {
    offerModal.classList.remove("flex");
    offerModal.classList.add("hidden");
  }

  function getSelectedValues(fieldId) {
    return Array.from(document.getElementById(fieldId).selectedOptions).map(
      (option) => option.value,
    );
  }

  function buildOfferPayload() {
    const offerId = document.getElementById("offerId").value;
    const name = document.getElementById("name").value.trim();
    const offerPercentageValue =
      document.getElementById("offerPercentage").value;
    const offerPercentage = Number(offerPercentageValue);
    const startDateValue = document.getElementById("startDate").value;
    const endDateValue = document.getElementById("endDate").value;
    const startDate = new Date(startDateValue);
    const endDate = new Date(endDateValue);
    const offerType = offerTypeSelect.value;
    const categories = getSelectedValues("categories");
    const products = getSelectedValues("products");
    const now = new Date();

    let hasErrors = false;

    if (!name) {
      showFieldError("name", "Offer Name is required");
      hasErrors = true;
    } else if (name.length < 10 || name.length > 50) {
      showFieldError("name", "Offer name must be between 10 and 50 characters");
      hasErrors = true;
    }

    if (!offerPercentageValue) {
      showFieldError("offerPercentage", "Offer Percentage is required");
      hasErrors = true;
    } else if (!Number.isInteger(offerPercentage)) {
      showFieldError(
        "offerPercentage",
        "Offer percentage must be a whole number",
      );
      hasErrors = true;
    } else if (offerPercentage < 1 || offerPercentage > 99) {
      showFieldError(
        "offerPercentage",
        "Offer percentage must be between 1 and 99",
      );
      hasErrors = true;
    }

    if (!startDateValue) {
      showFieldError("startDate", "Start Date is required");
      hasErrors = true;
    } else if (Number.isNaN(startDate.getTime())) {
      showFieldError("startDate", "Please enter a valid start date");
      hasErrors = true;
    } else if (!offerId && startDate < now) {
      showFieldError("startDate", "Start date cannot be in the past");
      hasErrors = true;
    }

    if (!endDateValue) {
      showFieldError("endDate", "End Date is required");
      hasErrors = true;
    } else if (Number.isNaN(endDate.getTime())) {
      showFieldError("endDate", "Please enter a valid end date");
      hasErrors = true;
    } else if (endDate <= startDate) {
      showFieldError("endDate", "End date must be after start date");
      hasErrors = true;
    }

    if (offerType === "category" && categories.length === 0) {
      showFieldError("categories", "Please select at least one category");
      hasErrors = true;
    }

    if (offerType === "product" && products.length === 0) {
      showFieldError("products", "Please select at least one product");
      hasErrors = true;
    }

    if (hasErrors) {
      return null;
    }

    return {
      offerId,
      payload: {
        name,
        offerType,
        offerPercentage,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        categories,
        products,
      },
    };
  }

  function buildOfferRow({ offerId, payload, isActive = true }) {
    return `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">1</td>
              <td class="px-6 py-4 whitespace-nowrap">${payload.name}</td>
              <td class="px-6 py-4 whitespace-nowrap">${payload.offerType}</td>
              <td class="px-6 py-4 whitespace-nowrap">${payload.offerPercentage}%</td>
              <td class="px-6 py-4 whitespace-nowrap">${new Date(payload.startDate).toLocaleDateString()}</td>
              <td class="px-6 py-4 whitespace-nowrap">${new Date(payload.endDate).toLocaleDateString()}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
                  ${isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button onclick="editOffer('${offerId}')" class="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600">
                    Edit
                  </button>
                  <button onclick="toggleOfferStatus('${offerId}', '${isActive}')" class="${isActive ? "bg-primary-accent hover:bg-red-600" : "bg-green-700 hover:bg-green-600"} text-white px-3 py-2 rounded-md">
                    ${isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onclick="deleteOffer('${offerId}')" class="bg-primary-accent text-white px-3 py-2 rounded-md hover:bg-red-600">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
        `;
  }

  function renumberRows() {
    const rows = document.querySelectorAll("#offersTable tr");
    rows.forEach((row, index) => {
      const numberCell = row.querySelector("td:first-child");
      if (numberCell) {
        numberCell.textContent = (currentPage - 1) * 10 + index + 1;
      }
    });
  }

  function populateOfferForm(offerId, offer) {
    document.getElementById("modalTitle").textContent = "Edit Offer";
    document.getElementById("offerId").value = offerId;
    document.getElementById("name").value = offer.name;
    offerTypeSelect.value = offer.offerType;
    document.getElementById("offerPercentage").value = offer.offerPercentage;

    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);
    startDate.setMinutes(startDate.getMinutes() + 330);
    endDate.setMinutes(endDate.getMinutes() + 330);

    document.getElementById("startDate").value = startDate
      .toISOString()
      .slice(0, 16);
    document.getElementById("endDate").value = endDate
      .toISOString()
      .slice(0, 16);

    handleOfferTypeChange();

    const selectId = offer.offerType === "category" ? "categories" : "products";
    const selectedIds =
      offer.offerType === "category"
        ? offer.applicableCategories
        : offer.applicableProducts;
    const select = document.getElementById(selectId);
    Array.from(select.options).forEach((option) => {
      option.selected = selectedIds.includes(option.value);
    });
  }

  async function addOffer() {
    document.getElementById("modalTitle").textContent = "Add New Offer";
    offerForm.reset();
    document.getElementById("offerId").value = "";
    resetFormErrors("offerForm");
    handleOfferTypeChange();
    openModal();
  }

  async function editOffer(offerId) {
    try {
      const response = await axios.get(`/admin/offers/${offerId}`);
      if (!response.data.success || !response.data.offer) {
        throw new Error(
          response.data.message || "Failed to fetch offer details",
        );
      }

      resetFormErrors("offerForm");
      populateOfferForm(offerId, response.data.offer);
      openModal();
    } catch (error) {
      console.error("Error in editOffer:", error);
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch offer details",
        "error",
      );
    }
  }

  async function submitOfferForm(event) {
    event.preventDefault();
    resetFormErrors("offerForm");

    const offerData = buildOfferPayload();
    if (!offerData) return;

    const { offerId, payload } = offerData;
    const method = offerId ? "put" : "post";
    const url = offerId ? `/admin/offers/${offerId}` : "/admin/offers";

    try {
      const response = await axios[method](url, payload);
      if (!response.data.success) {
        showToast(
          response.data.message ||
            `Failed to ${method === "put" ? "update" : "add"} offer`,
          "error",
        );
        return;
      }

      closeModal();

      if (method === "put") {
        const row = document
          .querySelector(`button[onclick="editOffer('${offerId}')"]`)
          ?.closest("tr");
        if (row) {
          row.children[1].textContent = payload.name;
          row.children[2].textContent = payload.offerType;
          row.children[3].textContent = `${payload.offerPercentage}%`;
          row.children[4].textContent = new Date(
            payload.startDate,
          ).toLocaleDateString();
          row.children[5].textContent = new Date(
            payload.endDate,
          ).toLocaleDateString();
        }

        showToast("Offer updated successfully");
        return;
      }

      const tbody = document.getElementById("offersTable");
      const newRow = buildOfferRow({ offerId: response.data.offerId, payload });

      if (tbody.querySelector('td[colspan="8"]')) {
        tbody.innerHTML = newRow;
      } else {
        tbody.insertAdjacentHTML("afterbegin", newRow);
        renumberRows();
      }

      showToast("Offer added successfully");
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          `Failed to ${method === "put" ? "update" : "add"} offer`,
        "error",
      );
    }
  }

  async function toggleOfferStatus(offerId, currentStatus) {
    const action = currentStatus === "true" ? "deactivate" : "activate";
    const confirmed = await customConfirm(
      `Are you sure you want to ${action} this offer?`,
      `${action.charAt(0).toUpperCase()}${action.slice(1)} Offer`,
    );
    if (!confirmed) return;

    try {
      const response = await axios.patch(
        `/admin/offers/${offerId}/toggle-status`,
      );
      if (!response.data.success) return;

      const row = document
        .querySelector(
          `button[onclick="toggleOfferStatus('${offerId}', '${currentStatus}')"]`,
        )
        ?.closest("tr");
      if (!row) return;

      const statusBadge = row.querySelector("td:nth-child(7) span");
      const toggleButton = row.querySelector(
        `button[onclick*="toggleOfferStatus('${offerId}"]`,
      );
      const newStatus = currentStatus !== "true";

      statusBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${newStatus ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
      statusBadge.textContent = newStatus ? "Active" : "Inactive";

      toggleButton.textContent = newStatus ? "Deactivate" : "Activate";
      toggleButton.className = `${newStatus ? "bg-primary-accent hover:bg-red-600" : "bg-green-700 hover:bg-green-600"} text-white px-3 py-2 rounded-md`;
      toggleButton.setAttribute(
        "onclick",
        `toggleOfferStatus('${offerId}', '${newStatus}')`,
      );

      showToast(response.data.message);
    } catch (error) {
      console.error("Error:", error);
      showToast(
        error.response?.data?.message || `Failed to ${action} offer`,
        "error",
      );
    }
  }

  async function deleteOffer(offerId) {
    const confirmed = await customConfirm(
      "Are you sure you want to delete this offer?",
      "Delete Offer",
    );
    if (!confirmed) return;

    try {
      const response = await axios.delete(`/admin/offers/${offerId}`);
      if (!response.data.success) return;

      document
        .querySelector(`button[onclick="deleteOffer('${offerId}')"]`)
        ?.closest("tr")
        ?.remove();
      const tbody = document.getElementById("offersTable");
      const rows = tbody.querySelectorAll("tr");

      if (rows.length === 0) {
        tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                            No offers available
                        </td>
                    </tr>
                `;
      } else {
        renumberRows();
      }

      showToast(response.data.message);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to delete offer",
        "error",
      );
    }
  }

  async function submitReferralForm(event) {
    event.preventDefault();

    const formData = {
      referrerValue: parseInt(
        document.getElementById("referrerValue").value,
        10,
      ),
      refereeValue: parseInt(document.getElementById("refereeValue").value, 10),
    };

    try {
      const response = await axios.post("/admin/referral-settings", formData);
      if (response.data.success) {
        showToast("Referral settings updated successfully");
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update referral settings",
        "error",
      );
    }
  }

  offerForm.addEventListener("submit", submitOfferForm);
  referralForm.addEventListener("submit", submitReferralForm);
  attachFieldClearHandlers(OFFER_FIELDS);
  handleOfferTypeChange();

  window.addOffer = addOffer;
  window.editOffer = editOffer;
  window.toggleOfferStatus = toggleOfferStatus;
  window.deleteOffer = deleteOffer;
  window.closeModal = closeModal;
  window.handleOfferTypeChange = handleOfferTypeChange;
}

export { createOffersPage };
