import {
  attachFieldClearHandlers,
  resetFormErrors,
  showFieldError,
} from "/js/formFeedback.js";
import { openRazorpayCheckout } from "/js/razorpay.js";
import { customConfirm, showToast } from "/js/util.js";

function createOrderDetailsPage({ razorpayKey, user }) {
  let currentRating = 0;

  function toggleModal(modalId, visible) {
    const modal = document.getElementById(modalId);
    modal.classList.toggle("hidden", !visible);
    modal.classList.toggle("flex", visible);
  }

  function reloadAfterDelay() {
    setTimeout(() => window.location.reload(), 1500);
  }

  async function cancelOrderItem(orderId, itemId) {
    try {
      const confirmed = await customConfirm(
        "Are you sure you want to cancel this item?",
      );
      if (!confirmed) return;

      const response = await axios.post(
        `/orders/${orderId}/items/${itemId}/cancel`,
      );
      if (!response.data.success) {
        showToast(response.data.message || "Failed to cancel item", "error");
        return;
      }

      showToast("Item cancelled successfully", "success");
      reloadAfterDelay();
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to cancel item", "error");
    }
  }

  function openReturnModal(orderId, itemId) {
    document.getElementById("returnOrderId").value = orderId;
    document.getElementById("returnItemId").value = itemId;
    toggleModal("returnModal", true);
  }

  function closeReturnModal() {
    document.getElementById("returnForm").reset();
    resetFormErrors("returnForm");
    document.getElementById("charCount").textContent = "0";
    toggleModal("returnModal", false);
  }

  async function submitReturnForm(event) {
    event.preventDefault();
    resetFormErrors("returnForm");

    const reason = document.getElementById("returnReason").value.trim();
    if (!reason) {
      showFieldError("returnReason", "Return reason is required");
      return;
    }

    if (reason.length < 10) {
      showFieldError(
        "returnReason",
        "Return reason must be at least 10 characters long",
      );
      return;
    }

    try {
      const orderId = document.getElementById("returnOrderId").value;
      const itemId = document.getElementById("returnItemId").value;
      const response = await axios.post(
        `/orders/${orderId}/items/${itemId}/return`,
        { reason },
      );

      if (!response.data.success) {
        showToast(
          response.data.message || "Failed to submit return request",
          "error",
        );
        return;
      }

      showToast("Return request submitted successfully", "success");
      closeReturnModal();
      reloadAfterDelay();
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to submit return request", "error");
    }
  }

  async function downloadInvoice(orderId, itemId) {
    try {
      const response = await axios.get(
        `/orders/${orderId}/items/${itemId}/invoice`,
        { responseType: "blob" },
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${orderId}-${itemId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast("Failed to download invoice", "error");
    }
  }

  async function verifyPayment(paymentData) {
    try {
      const response = await axios.post("/checkout/verifypayment", paymentData);
      if (!response.data.success) {
        showToast("Payment verification failed", "error");
        return;
      }

      showToast("Payment successful", "success");
      reloadAfterDelay();
    } catch (error) {
      console.error("Error:", error);
      showToast("Payment verification failed", "error");
    }
  }

  async function retryPayment(orderId) {
    try {
      const response = await axios.post(`/orders/${orderId}/retry-payment`);
      if (!response.data.success) {
        showToast(
          response.data.message || "Failed to initialize payment",
          "error",
        );
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
        },
        onDismiss: () => showToast("Payment failed", "error"),
        onSuccess: (paymentResponse) =>
          verifyPayment({
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            orderId,
          }),
      });
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to initialize payment", "error");
    }
  }

  function resetStars() {
    currentRating = 0;
    document.getElementById("ratingInput").value = "";
    document.querySelectorAll(".star-btn").forEach((star) => {
      star.style.color = "#D1D5DB";
    });
  }

  function setRating(rating) {
    currentRating = Number(rating);
    document.getElementById("ratingInput").value = rating;
    document.getElementById("ratingInput").classList.remove("border-red-500");
    document.getElementById("ratingInputError").classList.add("hidden");

    document.querySelectorAll(".star-btn").forEach((star, index) => {
      star.style.color = index < currentRating ? "#FBBF24" : "#D1D5DB";
    });
  }

  async function fetchExistingReview(productName) {
    try {
      const response = await axios.get("/review/get", {
        params: { productName },
      });
      if (!response.data.success) return;

      const { rating, comment } = response.data.review;
      setRating(rating);
      document.getElementById("reviewComment").value = comment;
      document.getElementById("reviewCharCount").textContent = comment.length;
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error fetching review:", error);
      }
    }
  }

  function openReviewModal(productName) {
    document.getElementById("reviewProductName").value = productName;
    document.getElementById("reviewForm").reset();
    resetFormErrors("reviewForm");
    document.getElementById("reviewCharCount").textContent = "0";
    resetStars();
    toggleModal("reviewModal", true);
    fetchExistingReview(productName);
  }

  function closeReviewModal() {
    document.getElementById("reviewForm").reset();
    resetFormErrors("reviewForm");
    document.getElementById("reviewCharCount").textContent = "0";
    resetStars();
    toggleModal("reviewModal", false);
  }

  async function submitReviewForm(event) {
    event.preventDefault();
    resetFormErrors("reviewForm");

    const productName = document.getElementById("reviewProductName").value;
    const comment = document.getElementById("reviewComment").value.trim();

    if (!currentRating) {
      showFieldError("ratingInput", "Please select a rating");
      return;
    }

    if (!comment) {
      showFieldError("reviewComment", "Review comment is required");
      return;
    }

    if (comment.length < 10) {
      showFieldError(
        "reviewComment",
        "Review must be at least 10 characters long",
      );
      return;
    }

    try {
      const response = await axios.post("/review/add", {
        productName,
        rating: currentRating,
        comment,
      });

      if (!response.data.success) {
        showToast(response.data.message || "Failed to submit review", "error");
        return;
      }

      showToast(response.data.message, "success");
      closeReviewModal();
    } catch (error) {
      console.error("Error:", error);
      showToast(
        error.response?.data?.message || "Failed to submit review",
        "error",
      );
    }
  }

  document.getElementById("returnReason").addEventListener("input", (event) => {
    document.getElementById("charCount").textContent =
      event.target.value.length;
  });
  document
    .getElementById("reviewComment")
    .addEventListener("input", (event) => {
      document.getElementById("reviewCharCount").textContent =
        event.target.value.length;
    });
  attachFieldClearHandlers(["returnReason", "reviewComment", "ratingInput"]);
  document
    .getElementById("returnForm")
    .addEventListener("submit", submitReturnForm);
  document
    .getElementById("reviewForm")
    .addEventListener("submit", submitReviewForm);

  window.cancelOrderItem = cancelOrderItem;
  window.openReturnModal = openReturnModal;
  window.closeReturnModal = closeReturnModal;
  window.downloadInvoice = downloadInvoice;
  window.retryPayment = retryPayment;
  window.openReviewModal = openReviewModal;
  window.closeReviewModal = closeReviewModal;
  window.setRating = setRating;
}

export { createOrderDetailsPage };
