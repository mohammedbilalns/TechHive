import { setLoadingState } from "/js/loadingState.js";

export function setProductFormLoadingState(form, isLoading, loadingText) {
  const submitButton =
    form.querySelector('button[type="submit"]') ||
    form.querySelector('input[type="submit"]') ||
    document.querySelector(`button[form="${form.id}"][type="submit"]`) ||
    document.querySelector(`input[form="${form.id}"][type="submit"]`);

  return submitButton
    ? setLoadingState(submitButton, isLoading, loadingText)[0] || null
    : null;
}
