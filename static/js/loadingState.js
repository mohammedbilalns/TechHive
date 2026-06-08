function resolveLoadingButtons(target) {
  if (!target) {
    return [];
  }

  if (typeof target === "string") {
    return Array.from(document.querySelectorAll(target));
  }

  if (target instanceof NodeList || Array.isArray(target)) {
    return Array.from(target).filter(Boolean);
  }

  return [target];
}

function isCompactLoadingButton(button) {
  if (!button) {
    return false;
  }

  if (button.dataset?.loadingVariant === "icon") {
    return true;
  }

  if (button.dataset?.loadingVariant === "default") {
    return false;
  }

  const hasVisibleText = (button.textContent || "").trim().length > 0;
  const hasIconChild = Boolean(button.querySelector("svg, i"));

  return hasIconChild && !hasVisibleText;
}

function getLoadingVariant(button) {
  return isCompactLoadingButton(button) ? "icon" : "default";
}

function getCompactLoaderColor(button) {
  if (!button) {
    return "#da0037";
  }

  const classNames = button.classList ? Array.from(button.classList) : [];
  const classString = classNames.join(" ");
  const computedBackground = window.getComputedStyle(button).backgroundColor;
  const isRedClass =
    classString.includes("bg-primary-accent") ||
    classString.includes("hover:bg-primary-accent") ||
    classString.includes("bg-red-600") ||
    classString.includes("hover:bg-red-600") ||
    classString.includes("bg-[#DA0037]") ||
    classString.includes("hover:bg-[#DA0037]");
  const isRedComputedBackground =
    /rgb\(\s*(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(?:0|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])\s*,\s*(?:0|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])\s*\)/i.test(
      computedBackground,
    ) ||
    computedBackground.toLowerCase().includes("da0037");

  return isRedClass || isRedComputedBackground ? "#ffffff" : "#da0037";
}

export function setLoadingState(target, isLoading, loadingText = "Loading...") {
  const buttons = resolveLoadingButtons(target);
  const affectedButtons = [];

  buttons.forEach((button) => {
    if (!button || typeof button !== "object") {
      return;
    }

    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }

    if (isLoading) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.classList.add("opacity-70", "cursor-not-allowed");
      if (getLoadingVariant(button) === "icon") {
        const loaderColor = getCompactLoaderColor(button);
        button.style.width = `${button.offsetWidth}px`;
        button.style.height = `${button.offsetHeight}px`;
        button.style.padding = "0";
        button.style.display = "inline-flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.innerHTML = `
          <span class="inline-flex items-center justify-center" aria-hidden="true" style="color: ${loaderColor};">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" class="animate-spin">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.2"></circle>
              <path fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4a12 12 0 00-12 12h4z"></path>
            </svg>
          </span>
        `;
      } else {
        button.innerHTML = `
          <span class="inline-flex items-center gap-2">
            <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4a12 12 0 00-12 12h4z"></path>
            </svg>
            <span>${loadingText}</span>
          </span>
        `;
      }
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.classList.remove("opacity-70", "cursor-not-allowed");
      button.style.removeProperty("width");
      button.style.removeProperty("height");
      button.style.removeProperty("padding");
      button.style.removeProperty("display");
      button.style.removeProperty("align-items");
      button.style.removeProperty("justify-content");
      button.innerHTML = button.dataset.originalHtml || button.innerHTML;
    }

    affectedButtons.push(button);
  });

  return affectedButtons;
}

export function setButtonLoading(button, isLoading, loadingText = "Loading...") {
  return setLoadingState(button, isLoading, loadingText)[0] || null;
}

export function getButtonByOnclick(selectorPart) {
  return document.querySelector(`button[onclick*="${selectorPart}"]`);
}

export function getButtonsByOnclick(selectorPart) {
  return document.querySelectorAll(`button[onclick*="${selectorPart}"]`);
}

export async function withButtonLoading(button, loadingText, action) {
  setButtonLoading(button, true, loadingText);

  try {
    return await action();
  } finally {
    setButtonLoading(button, false);
  }
}
