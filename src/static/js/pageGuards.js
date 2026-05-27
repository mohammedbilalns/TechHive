function preventCurrentPageNavigation(selector = '.nav-link') {
    const links = document.querySelectorAll(selector);

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            if (window.location.pathname === link.getAttribute('href')) {
                event.preventDefault();
            }
        });
    });
}

export { preventCurrentPageNavigation };
