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

// Export the functions
export { customConfirm, showAlert, closeCustomAlert }; 