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
      button.innerHTML = `
        <span class="inline-flex items-center gap-2">
          <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4a12 12 0 00-12 12h4z"></path>
          </svg>
          <span>${loadingText}</span>
        </span>
      `;
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.classList.remove("opacity-70", "cursor-not-allowed");
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
