// Custom Confirm Dialog
function customConfirm(message, confirmButtonText = 'Confirm') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const messageElement = document.getElementById('confirmMessage');
        messageElement.textContent = message;
        
        // Set confirm button text if provided
        const confirmButton = document.getElementById('confirmAction');
        confirmButton.textContent = confirmButtonText;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const handleConfirm = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            confirmButton.removeEventListener('click', handleConfirm);
            document.getElementById('cancelConfirm').removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            confirmButton.removeEventListener('click', handleConfirm);
            document.getElementById('cancelConfirm').removeEventListener('click', handleCancel);
            resolve(false);
        };

        confirmButton.addEventListener('click', handleConfirm);
        document.getElementById('cancelConfirm').addEventListener('click', handleCancel);
    });
}

// Custom Alert Dialog
function showAlert(message, type = 'success') {
    const alertModal = document.getElementById('customAlert');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertIcon = document.getElementById('alertIcon');
    const alertContent = document.getElementById('alertContent');

    // Enhanced positioning classes with compact sizing
    alertModal.classList.add('fixed', 'bottom-4', 'right-4', 'z-50', 'p-3');  // Reduced padding
    alertModal.classList.remove('inset-0', 'items-center', 'justify-center', 'p-4', 'p-5', 'p-6');  // Remove any larger padding
    
    // Make content more compact
    alertContent.classList.add('space-y-1');  // Reduce space between elements
    alertContent.classList.remove('space-y-2', 'space-y-3', 'space-y-4');  // Remove any larger spacing
    
    // Configure based on type
    if (type === 'error') {
        alertTitle.textContent = 'Error';
        alertIcon.innerHTML = '<i class="fas fa-times-circle text-red-500"></i>';
        alertContent.classList.add('text-red-600');
    } else {
        alertTitle.textContent = 'Success';
        alertIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
        alertContent.classList.add('text-green-600');
    }

    alertMessage.textContent = message;
    alertModal.classList.replace('hidden', 'flex');
    alertModal.style.backgroundColor = 'transparent';

    // Auto close after 3 seconds
    const timeout = setTimeout(() => {
        closeCustomAlert();
    }, 1500);

    // Store the timeout ID in the modal element
    alertModal.dataset.timeoutId = timeout;
}

function closeCustomAlert() {
    const alertModal = document.getElementById('customAlert');
    
    if (alertModal.dataset.timeoutId) {
        clearTimeout(Number(alertModal.dataset.timeoutId));
    }
    
    alertModal.classList.add('hidden');
    
    const alertContent = document.getElementById('alertContent');
    alertContent.classList.remove('text-red-600', 'text-green-600');
}

// Custom Toast using Toastify
function showToast(message, type = 'success') {
    const baseConfig = {
        text: `<div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2">
                    <i class="fas fa-${type === 'error' ? 'times' : 
                               type === 'warning' ? 'exclamation' :
                               type === 'info' ? 'info' : 
                               'check'}-circle" style="color: ${
                               type === 'error' ? '#DA0037' :
                               type === 'warning' ? '#F59E0B' :
                               type === 'info' ? '#3B82F6' :
                               '#008767'}"></i>
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
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minWidth: "300px",
            maxWidth: "400px",
            margin: "0 1rem 1rem 0"
        }
    };

    // Configure based on type (only for border color now)
    if (type === 'error') {
        baseConfig.style.borderLeft = "4px solid #DA0037";
    } else if (type === 'warning') {
        baseConfig.style.borderLeft = "4px solid #F59E0B";
    } else if (type === 'info') {
        baseConfig.style.borderLeft = "4px solid #3B82F6";
    } else {
        baseConfig.style.borderLeft = "4px solid #008767";
    }

    Toastify(baseConfig).showToast();
}

// Update toast styles
const toastStyles = document.createElement('style');
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

// Export the functions
export { showToast, customConfirm, showAlert, closeCustomAlert }; 