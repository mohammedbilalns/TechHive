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

    // Auto close after 3 seconds
    const timeout = setTimeout(() => {
        closeCustomAlert();
    }, 3000);

    // Store the timeout ID in the modal element
    alertModal.dataset.timeoutId = timeout;
}

function closeCustomAlert() {
    const alertModal = document.getElementById('customAlert');
    
    // Clear any existing timeout
    if (alertModal.dataset.timeoutId) {
        clearTimeout(Number(alertModal.dataset.timeoutId));
    }
    
    alertModal.classList.add('hidden');
    
    // Reset classes
    const alertContent = document.getElementById('alertContent');
    alertContent.classList.remove('text-red-600', 'text-green-600');
}

// Export the functions
export { customConfirm, showAlert, closeCustomAlert }; 