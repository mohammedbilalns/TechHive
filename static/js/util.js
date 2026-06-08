import {
  getButtonsByOnclick,
  setLoadingState,
} from "/js/loadingState.js";

// Custom Confirm Dialog
function customConfirm(message, confirmButtonText = "Confirm") {
  return new Promise((resolve) => {
    const modal = document.getElementById("customConfirmModal");
    const messageElement = document.getElementById("confirmMessage");
    messageElement.textContent = message;

    // Set confirm button text if provided
    const confirmButton = document.getElementById("confirmAction");
    confirmButton.textContent = confirmButtonText;

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    const handleConfirm = () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      confirmButton.removeEventListener("click", handleConfirm);
      document
        .getElementById("cancelConfirm")
        .removeEventListener("click", handleCancel);
      resolve(true);
    };

    const handleCancel = () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      confirmButton.removeEventListener("click", handleConfirm);
      document
        .getElementById("cancelConfirm")
        .removeEventListener("click", handleCancel);
      resolve(false);
    };

    confirmButton.addEventListener("click", handleConfirm);
    document
      .getElementById("cancelConfirm")
      .addEventListener("click", handleCancel);
  });
}

// Custom Toast using Toastify
function showToast(message, type = "success") {
  const baseConfig = {
    text: `<div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2">
                    <i class="fas fa-${
                      type === "error"
                        ? "times"
                        : type === "warning"
                          ? "exclamation"
                          : type === "info"
                            ? "info"
                            : "check"
                    }-circle" style="color: ${
                      type === "error"
                        ? "#DA0037"
                        : type === "warning"
                          ? "#F59E0B"
                          : type === "info"
                            ? "#3B82F6"
                            : "#008767"
                    }"></i>
                    <span style="color: #1F2937">${message}</span>
                </div>
               </div>`,
    duration: 3000,
    close: true,
    gravity: "bottom",
    position: "right",
    stopOnFocus: true,
    className: "custom-toast",
    escapeMarkup: false,
    style: {
      background: "white",
      padding: "12px 24px",
      borderRadius: "6px",
      fontWeight: "500",
      fontSize: "14px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minWidth: "300px",
      maxWidth: "400px",
      margin: "0 1rem 1rem 0",
    },
  };

  // Configure based on type (only for border color now)
  if (type === "error") {
    baseConfig.style.borderLeft = "4px solid #DA0037";
  } else if (type === "warning") {
    baseConfig.style.borderLeft = "4px solid #F59E0B";
  } else if (type === "info") {
    baseConfig.style.borderLeft = "4px solid #3B82F6";
  } else {
    baseConfig.style.borderLeft = "4px solid #008767";
  }

  Toastify(baseConfig).showToast();
}

async function addToCart(productId) {
  const loadingButtons = getButtonsByOnclick(`addToCart('${productId}')`);
  setLoadingState(loadingButtons, true, "Adding...");

  try {
    const { data } = await axios.post("/cart", { productId });
    const toastType = data.success ? "success" : "error";

    const cartQuantityElement = document.getElementById("cart-quantity");
    const cartQuantityMobileElement = document.getElementById(
      "cart-quantity-mobile",
    );
    const cartCountElement = document.getElementById("cartCount");

    if (cartQuantityElement && data.totalQuantity !== undefined) {
      cartQuantityElement.innerText = data.totalQuantity;
    }

    if (cartQuantityMobileElement && data.totalQuantity !== undefined) {
      cartQuantityMobileElement.innerText = data.totalQuantity;
    }

    if (cartCountElement && data.cartCount !== undefined) {
      cartCountElement.textContent = data.cartCount;
    }

    showToast(data.message, toastType);
    return data;
  } catch (error) {
    console.error("Error:", error);
    showToast(
      error.response?.data?.message || "Error adding item to cart",
      "error",
    );
    throw error;
  } finally {
    setLoadingState(loadingButtons, false);
  }
}

function getWishlistRemoveConfig(pathname) {
  if (pathname.startsWith("/product/")) {
    return {
      addButtonClass:
        "w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-primary-accent hover:text-black transition-colors duration-300",
      iconClass: "h-5 w-5",
      addOnclick: "addToWishlist('%s')",
    };
  }

  if (pathname.startsWith("/search")) {
    return {
      addButtonClass:
        "p-2 rounded-full bg-gray-100 hover:bg-red-600 hover:text-white transition-colors duration-300",
      iconClass: "h-4 w-4",
      addOnclick: "event.preventDefault(); addToWishlist('%s')",
      updateWishlistItems: true,
    };
  }

  if (pathname.startsWith("/allproducts")) {
    return {
      addButtonClass:
        "p-2 rounded-full bg-gray-100 hover:bg-red-600 hover:text-white transition-colors duration-300",
      iconClass: "h-4 w-4",
      addOnclick: "addToWishlist('%s')",
    };
  }

  return {
    addButtonClass:
      "p-2 rounded-full bg-gray-100 hover:bg-red-600 hover:text-white transition-colors duration-300",
    iconClass: "h-4 w-4",
    addOnclick: "addToWishlist('%s')",
  };
}

function getWishlistAddConfig(pathname) {
  if (pathname.startsWith("/product/")) {
    return {
      removeButtonClass:
        "w-10 h-10 flex items-center justify-center rounded-full bg-primary-accent text-white hover:bg-gray-100 hover:text-black transition-colors duration-300",
      iconClass: "h-5 w-5",
      removeOnclick: "removeFromWishlist('%s')",
    };
  }

  if (pathname.startsWith("/search")) {
    return {
      removeButtonClass:
        "p-2 rounded-full bg-primary-accent text-white hover:bg-gray-100 hover:text-black transition-colors duration-300",
      iconClass: "h-4 w-4",
      removeOnclick: "event.preventDefault(); removeFromWishlist('%s')",
      updateWishlistItems: true,
    };
  }

  if (pathname.startsWith("/allproducts")) {
    return {
      removeButtonClass:
        "p-2 rounded-full bg-primary-accent text-white hover:bg-gray-100 hover:text-black transition-colors duration-300",
      iconClass: "h-4 w-4",
      removeOnclick: "removeFromWishlist('%s')",
    };
  }

  return {
    removeButtonClass:
      "p-2 rounded-full bg-primary-accent text-white hover:bg-gray-100 hover:text-black transition-colors duration-300",
    iconClass: "h-4 w-4",
    removeOnclick: "removeFromWishlist('%s')",
  };
}

function createWishlistAddButton(productId, config) {
  const button = document.createElement("button");
  button.setAttribute("onclick", config.addOnclick.replace("%s", productId));
  button.className = config.addButtonClass;
  button.dataset.loadingVariant = "icon";
  button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="${config.iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    `;
  return button;
}

function createWishlistRemoveButton(productId, config) {
  const button = document.createElement("button");
  button.setAttribute("onclick", config.removeOnclick.replace("%s", productId));
  button.className = config.removeButtonClass;
  button.dataset.loadingVariant = "icon";
  button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="${config.iconClass}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    `;
  return button;
}

async function addToWishlist(productId) {
  const loadingButtons = getButtonsByOnclick(`addToWishlist('${productId}')`);
  setLoadingState(loadingButtons, true, "Adding...");

  try {
    const { data } = await axios.post("/wishlist", { productId });

    if (!data.success) {
      showToast(data.message || "Failed to add item", "error");
      return data;
    }

    const config = getWishlistAddConfig(window.location.pathname);
    const wishlistButtons = document.querySelectorAll(
      `button[onclick*="addToWishlist('${productId}')"]`,
    );

    wishlistButtons.forEach((button) => {
      button.parentNode.replaceChild(
        createWishlistRemoveButton(productId, config),
        button,
      );
    });

    if (
      config.updateWishlistItems &&
      Array.isArray(window.wishlistItems) &&
      !window.wishlistItems.includes(productId)
    ) {
      window.wishlistItems.push(productId);
    }

    const wishlistQuantityElement =
      document.getElementById("wishlist-quantity");
    const wishlistQuantityMobileElement = document.getElementById(
      "wishlist-quantity-mobile",
    );

    if (wishlistQuantityElement && data.totalQuantity !== undefined) {
      wishlistQuantityElement.innerText = data.totalQuantity;
    }

    if (wishlistQuantityMobileElement && data.totalQuantity !== undefined) {
      wishlistQuantityMobileElement.innerText = data.totalQuantity;
    }

    showToast(data.message || "Item added to wishlist successfully", "success");
    return data;
  } catch (error) {
    console.error("Error:", error);
    showToast(
      error.response?.data?.message || "Error adding item to wishlist",
      "error",
    );
    throw error;
  } finally {
    setLoadingState(loadingButtons, false);
  }
}

async function removeFromWishlist(productId) {
  const loadingButtons = getButtonsByOnclick(`removeFromWishlist('${productId}')`);
  setLoadingState(loadingButtons, true, "Removing...");

  try {
    const response = await axios.put("/wishlist", { productId });
    const data = response.data;

    if (!data.success) {
      showToast(data.message || "Failed to remove item", "error");
      return data;
    }

    const config = getWishlistRemoveConfig(window.location.pathname);
    const wishlistButtons = document.querySelectorAll(
      `button[onclick*="removeFromWishlist('${productId}')"]`,
    );

    wishlistButtons.forEach((button) => {
      button.parentNode.replaceChild(
        createWishlistAddButton(productId, config),
        button,
      );
    });

    if (config.updateWishlistItems && Array.isArray(window.wishlistItems)) {
      window.wishlistItems = window.wishlistItems.filter(
        (id) => id !== productId,
      );
    }

    const wishlistQuantityElement =
      document.getElementById("wishlist-quantity");
    const wishlistQuantityMobileElement = document.getElementById(
      "wishlist-quantity-mobile",
    );

    if (wishlistQuantityElement && data.totalQuantity !== undefined) {
      wishlistQuantityElement.innerText = data.totalQuantity;
    }

    if (wishlistQuantityMobileElement && data.totalQuantity !== undefined) {
      wishlistQuantityMobileElement.innerText = data.totalQuantity;
    }

    showToast("Product removed from wishlist successfully", "success");
    return data;
  } catch (error) {
    console.error("Error:", error);
    showToast("Error removing item from wishlist", "error");
    throw error;
  } finally {
    setLoadingState(loadingButtons, false);
  }
}

// Update toast styles
const toastStyles = document.createElement("style");
toastStyles.textContent = `
    .custom-toast {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    }
    .custom-toast .toast-close {
        opacity: 1 !important;
        padding-left: 10px !important;
        color: #6B7280 !important;
        margin-left: auto !important;
    }
    .toastify {
        font-family: system-ui, -apple-system, sans-serif !important;
        width: auto !important;
    }
`;
document.head.appendChild(toastStyles);

export {
  showToast,
  customConfirm,
  addToCart,
  addToWishlist,
  removeFromWishlist,
};
