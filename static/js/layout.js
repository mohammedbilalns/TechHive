function toggleMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  if (!mobileMenu) return;

  mobileMenu.classList.toggle("hidden");
}

function validateSearch(form) {
  const searchQuery = form?.q?.value?.trim() || "";
  return searchQuery.length > 0;
}

function toggleUserSidebar() {
  if (typeof window.toggleSidebar === "function") {
    window.toggleSidebar();
    return;
  }

  window.location.href = "/account";
}

function applyGlobalImageLoadingState(root = document) {
  const images = root.querySelectorAll("img:not([data-no-image-loader])");

  images.forEach((img) => {
    if (img.dataset.imageLoaderBound === "true") {
      return;
    }

    img.dataset.imageLoaderBound = "true";
    img.classList.add("image-loading");

    const clearState = () => {
      img.classList.remove("image-loading");
      img.classList.add("image-loaded");
    };

    if (img.complete && img.naturalWidth > 0) {
      clearState();
      return;
    }

    img.addEventListener("load", clearState, { once: true });
    img.addEventListener(
      "error",
      () => {
        img.classList.remove("image-loading");
        img.classList.add("image-error");
      },
      { once: true },
    );
  });
}

if (typeof window !== "undefined") {
  window.toggleMenu = toggleMenu;
  window.validateSearch = validateSearch;
  window.toggleUserSidebar = toggleUserSidebar;
  window.applyGlobalImageLoadingState = applyGlobalImageLoadingState;

  const initializeImageLoadingState = () => {
    applyGlobalImageLoadingState();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.tagName === "IMG") {
            applyGlobalImageLoadingState(node.parentElement || document);
            return;
          }

          if (typeof node.querySelectorAll === "function") {
            applyGlobalImageLoadingState(node);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  document.addEventListener("DOMContentLoaded", initializeImageLoadingState);
}
