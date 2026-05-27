function toggleMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (!mobileMenu) return;

    mobileMenu.classList.toggle('hidden');
}

function validateSearch(form) {
    const searchQuery = form?.q?.value?.trim() || '';
    return searchQuery.length > 0;
}

function toggleUserSidebar() {
    if (typeof window.toggleSidebar === 'function') {
        window.toggleSidebar();
        return;
    }

    window.location.href = '/account';
}

if (typeof window !== 'undefined') {
    window.toggleMenu = toggleMenu;
    window.validateSearch = validateSearch;
    window.toggleUserSidebar = toggleUserSidebar;
}
