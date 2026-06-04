function getSubmitButton(form) {
  return (
    form.querySelector('button[type="submit"]') ||
    form.querySelector('input[type="submit"]') ||
    document.querySelector(`button[form="${form.id}"][type="submit"]`) ||
    document.querySelector(`input[form="${form.id}"][type="submit"]`)
  );
}

export function setProductFormLoadingState(form, isLoading, loadingText) {
  const submitButton = getSubmitButton(form);

  if (!submitButton) {
    return null;
  }

  if (!submitButton.dataset.originalHtml) {
    submitButton.dataset.originalHtml = submitButton.innerHTML;
  }

  if (isLoading) {
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitButton.classList.add("opacity-70", "cursor-not-allowed");
    submitButton.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4a12 12 0 00-12 12h4z"></path>
        </svg>
        <span>${loadingText}</span>
      </span>
    `;
    return submitButton;
  }

  submitButton.disabled = false;
  submitButton.removeAttribute("aria-busy");
  submitButton.classList.remove("opacity-70", "cursor-not-allowed");
  submitButton.innerHTML = submitButton.dataset.originalHtml;
  return submitButton;
}
