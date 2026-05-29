function togglePasswordVisibility(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);

  if (!input || !toggle) return;

  const icon = toggle.querySelector("i");

  toggle.addEventListener("click", () => {
    if (input.type === "password") {
      input.type = "text";
      if (icon) {
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      }
    } else {
      input.type = "password";
      if (icon) {
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    }
  });
}
export { togglePasswordVisibility };
if (typeof window !== "undefined") {
  window.togglePasswordVisibility = togglePasswordVisibility;
}
