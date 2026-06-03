import {
  attachModalBackdropClose,
  bindAddressFormInputs,
  openModal,
  populateAddressForm,
  readAddressForm,
  resetErrors,
  toggleModal,
  validateAddressData,
} from "/js/addressUtils.js";
import { createCheckoutAddressCard } from "/js/addressTemplates.js";
import { openRazorpayCheckout } from "/js/razorpay.js";
import { showToast } from "/js/util.js";

function createCheckoutPage({
  maxAddresses = 4,
  originalTotal,
  user,
  defaultContact,
  razorpayKey,
  sessionCoupon,
}) {
  const addressGrid = document.getElementById("checkout-address-grid");
  const addAddressButton = document.getElementById(
    "checkout-add-address-button",
  );
  const placeOrderButton = document.querySelector(
    'button[onclick="placeOrder()"]',
  );
  let currentCouponCode = null;
  let currentCouponDiscount = 0;

  function updateAddAddressButton() {
    if (!addAddressButton) return;
    addAddressButton.style.display =
      addressGrid.children.length >= maxAddresses ? "none" : "";
  }

  function toggleAddAddress() {
    toggleModal("addAddressModal", "addAddressForm", "add");
  }

  function toggleEditAddress() {
    toggleModal("editAddressModal", "editAddressForm", "edit");
  }

  async function editAddress(addressId) {
    try {
      const response = await axios.get(`/addresses/${addressId}`);
      if (!response.data.success) {
        showToast("Address not found", "error");
        return;
      }

      populateAddressForm("editAddressForm", {
        addressId,
        ...response.data.address,
      });
      resetErrors("edit");
      openModal("editAddressModal");
    } catch (error) {
      console.error("Error fetching address details:", error);
      showToast(
        error.response?.data?.message || "Failed to load address details",
        "error",
      );
    }
  }

  async function submitAddAddress() {
    try {
      resetErrors("add");
      const data = validateAddressData(
        readAddressForm("addAddressForm"),
        "add",
      );
      if (!data) return;

      const response = await axios.post("/addresses", data);
      if (!response.data.success) {
        showToast(response.data.message || "Failed to add address", "error");
        return;
      }

      addressGrid.insertAdjacentHTML(
        "beforeend",
        createCheckoutAddressCard(response.data.address, {
          checked: addressGrid.children.length === 0,
        }),
      );

      toggleAddAddress();
      updateAddAddressButton();
      showToast("Address added successfully", "success");
    } catch (error) {
      console.error("Add Address Error:", error);
      showToast(
        error.response?.data?.message || "Failed to add address",
        "error",
      );
    }
  }

  async function submitEditAddress() {
    try {
      resetErrors("edit");
      const rawData = readAddressForm("editAddressForm");
      const data = validateAddressData(rawData, "edit");
      if (!data) return;

      const selectedInput = document.querySelector(
        `input[name="selectedAddress"][value="${rawData.addressId}"]`,
      );
      const wasChecked = selectedInput?.checked || false;
      const response = await axios.put(`/addresses/${rawData.addressId}`, data);

      if (!response.data.success) {
        showToast(response.data.message || "Failed to update address", "error");
        return;
      }

      const addressCard = selectedInput?.closest(".border.rounded-lg");
      if (addressCard) {
        addressCard.outerHTML = createCheckoutAddressCard(
          response.data.address,
          { checked: wasChecked },
        );
      }

      toggleEditAddress();
      showToast("Address updated successfully", "success");
    } catch (error) {
      console.error("Edit Address Error:", error);
      showToast(
        error.response?.data?.message || "Failed to update address",
        "error",
      );
    }
  }

  function handlePaymentMethodChange(radio) {
    if (radio.disabled) return;
    placeOrderButton.textContent =
      radio.value === "cod" ? "Place Order" : "Proceed to Payment";
  }

  function getCurrentTotal() {
    return parseFloat(
      document.querySelector("[data-total]").textContent.replace("₹", ""),
    );
  }

  function updatePaymentMethods() {
    const total = getCurrentTotal();
    const codRadio = document.querySelector('input[value="cod"]');
    const onlineRadio = document.querySelector('input[value="online"]');

    if (total > 1000) {
      codRadio.disabled = true;
      if (codRadio.checked) {
        onlineRadio.checked = true;
        handlePaymentMethodChange(onlineRadio);
      }
      return;
    }

    codRadio.disabled = false;
  }

  async function placeOrder() {
    try {
      const selectedAddress = document.querySelector(
        'input[name="selectedAddress"]:checked',
      );
      const selectedPayment = document.querySelector(
        'input[name="paymentMethod"]:checked',
      );

      if (!selectedAddress) {
        showToast("Please select a delivery address", "error");
        return;
      }

      if (!selectedPayment) {
        showToast("Please select a payment method", "error");
        return;
      }

      const orderData = {
        addressId: selectedAddress.value,
        paymentMethod: selectedPayment.value,
        couponCode: currentCouponCode,
      };

      const response = await axios.post("/checkout/placeorder", orderData);
      if (!response.data.success) {
        showToast(response.data.message || "Failed to place order", "error");
        return;
      }

      if (orderData.paymentMethod !== "online") {
        window.location.href = `/orders/success/${response.data.orderId}`;
        return;
      }

      openRazorpayCheckout({
        key: razorpayKey,
        amount: response.data.amount,
        name: "TechHive",
        description: "Order Payment",
        orderId: response.data.razorpayOrderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: defaultContact,
        },
        onDismiss: () => {
          window.location.href = `/checkout/failed/${response.data.orderId}`;
        },
        onSuccess: async (paymentResponse) => {
          try {
            const verificationResponse = await axios.post(
              "/checkout/verifypayment",
              {
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId: response.data.orderId,
              },
            );

            window.location.href = verificationResponse.data.success
              ? `/orders/success/${response.data.orderId}`
              : `/checkout/failed/${response.data.orderId}`;
          } catch (error) {
            console.error("Payment verification error:", error);
            window.location.href = `/checkout/failed/${response.data.orderId}`;
          }
        },
      });
    } catch (error) {
      console.error("Error:", error);
      showToast(
        error.response?.data?.message || "Failed to place order",
        "error",
      );
    }
  }

  function toggleCouponInput() {
    document.getElementById("couponInputSection").classList.toggle("hidden");
  }

  async function applyCoupon() {
    const couponCode = document.getElementById("couponCode").value.trim();
    if (!couponCode) {
      showToast("Please enter a coupon code", "error");
      return;
    }

    try {
      const response = await axios.post("/checkout/apply-coupon", {
        couponCode,
      });
      if (!response.data.success) {
        showToast(response.data.message || "Error applying coupon", "error");
        return;
      }

      currentCouponCode = response.data.couponCode;
      currentCouponDiscount = response.data.discount;
      document.getElementById("couponInputSection").classList.add("hidden");
      document
        .getElementById("appliedCouponSection")
        .classList.remove("hidden");
      document.getElementById("couponToggle").classList.add("hidden");
      document.getElementById("appliedCouponCode").textContent =
        currentCouponCode;
      document.getElementById("couponDiscount").textContent =
        `-₹${currentCouponDiscount.toFixed(2)}`;
      document.querySelector("[data-total]").textContent =
        `₹${(originalTotal - currentCouponDiscount).toFixed(2)}`;
      updatePaymentMethods();
      showToast(response.data.message, "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Error applying coupon",
        "error",
      );
    }
  }

  async function removeCoupon() {
    try {
      const response = await axios.post("/checkout/remove-coupon");
      if (!response.data.success) {
        showToast(response.data.message || "Error removing coupon", "error");
        return;
      }

      currentCouponCode = null;
      currentCouponDiscount = 0;
      document.getElementById("couponInputSection").classList.add("hidden");
      document.getElementById("appliedCouponSection").classList.add("hidden");
      document.getElementById("couponToggle").classList.remove("hidden");
      document.getElementById("couponCode").value = "";
      document.querySelector("[data-total]").textContent =
        `₹${originalTotal.toFixed(2)}`;
      updatePaymentMethods();
      showToast("Coupon removed successfully", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Error removing coupon",
        "error",
      );
    }
  }

  bindAddressFormInputs("add");
  bindAddressFormInputs("edit");
  attachModalBackdropClose("addAddressModal", toggleAddAddress);
  attachModalBackdropClose("editAddressModal", toggleEditAddress);
  document
    .getElementById("couponCode")
    .addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCoupon();
      }
    });
  updateAddAddressButton();
  updatePaymentMethods();
  const selectedPayment = document.querySelector(
    'input[name="paymentMethod"]:checked',
  );
  if (selectedPayment) {
    handlePaymentMethodChange(selectedPayment);
  }

  if (sessionCoupon) {
    currentCouponCode = sessionCoupon.code;
    currentCouponDiscount = sessionCoupon.discount;
    document.getElementById("couponInputSection").classList.add("hidden");
    document.getElementById("appliedCouponSection").classList.remove("hidden");
    document.getElementById("couponToggle").classList.add("hidden");
    document.getElementById("appliedCouponCode").textContent =
      currentCouponCode;
    document.getElementById("couponDiscount").textContent =
      `-₹${currentCouponDiscount.toFixed(2)}`;
    document.querySelector("[data-total]").textContent =
      `₹${(originalTotal - currentCouponDiscount).toFixed(2)}`;
    updatePaymentMethods();
  }

  window.toggleAddAddress = toggleAddAddress;
  window.toggleEditAddress = toggleEditAddress;
  window.editAddress = editAddress;
  window.submitAddAddress = submitAddAddress;
  window.submitEditAddress = submitEditAddress;
  window.handlePaymentMethodChange = handlePaymentMethodChange;
  window.placeOrder = placeOrder;
  window.toggleCouponInput = toggleCouponInput;
  window.applyCoupon = applyCoupon;
  window.removeCoupon = removeCoupon;
}

export { createCheckoutPage };
