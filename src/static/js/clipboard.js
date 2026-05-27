async function copyTextToClipboard(text, messages = {}) {
  const {
    successMessage = "Copied to clipboard!",
    errorMessage = "Failed to copy text",
    onSuccess = () => {},
    onError = () => {},
  } = messages;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      onSuccess(successMessage);
      return true;
    } catch (error) {
      console.error("Clipboard API failed:", error);
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    onSuccess(successMessage);
    return true;
  } catch (error) {
    console.error("Fallback copy method failed:", error);
    onError(errorMessage);
    return false;
  }
}

export { copyTextToClipboard };
