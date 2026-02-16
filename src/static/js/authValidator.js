
// Validation Patterns and Utilities for Auth Pages


const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NAME: /^[a-zA-Z ]{3,30}$/,
    PHONE: /^\d{10}$/,
    PASSWORD: {
        MIN_LENGTH: 8,
        UPPERCASE: /[A-Z]/,
        LOWERCASE: /[a-z]/,
        NUMBER: /\d/,
        SPECIAL_CHAR: /[!@#$%^&*(),.?":{}|<>]/
    }
};


/**
 * Validates email format
 */
function isValidEmail(email) {
    return VALIDATION_PATTERNS.EMAIL.test(email);
}

/**
 * Validates password complexity
 */
function isStrongPassword(password) {
    const { MIN_LENGTH, UPPERCASE, LOWERCASE, NUMBER, SPECIAL_CHAR } = VALIDATION_PATTERNS.PASSWORD;
    if (password.length < MIN_LENGTH) return false;
    if (!UPPERCASE.test(password)) return false;
    if (!LOWERCASE.test(password)) return false;
    if (!NUMBER.test(password)) return false;
    if (!SPECIAL_CHAR.test(password)) return false;
    return true;
}

/**
 * Validates name format
 */
function isValidName(name) {
    return VALIDATION_PATTERNS.NAME.test(name);
}

/**
 * Validates phone number format
 */
function isValidPhone(phone) {
    return VALIDATION_PATTERNS.PHONE.test(phone);
}

/**
 * Shows error message for a specific input field
 */
function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);

    if (input) input.classList.add('border-red-500');
    if (errorElement) {
        errorElement.textContent = message;
    }
}

/**
 * Clears error for a specific field
 */
function clearError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);

    if (input) input.classList.remove('border-red-500');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

/**
 * Resets errors for multiple fields
 */
function resetErrors(fields) {
    fields.forEach(field => clearError(field));
}

/**
 * Attaches real-time validation cleanup on input
 */
function attachInputListeners(fields) {
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.addEventListener('input', () => clearError(field));
        }
    });
}

// Export functions for module usage
export {
    isValidEmail,
    isStrongPassword,
    isValidName,
    isValidPhone,
    showError,
    clearError,
    resetErrors,
    attachInputListeners
};

// Attach to window for global usage (backward compatibility)
window.isValidEmail = isValidEmail;
window.isStrongPassword = isStrongPassword;
window.isValidName = isValidName;
window.isValidPhone = isValidPhone;
window.showError = showError;
window.clearError = clearError;
window.resetErrors = resetErrors;
window.attachInputListeners = attachInputListeners;
