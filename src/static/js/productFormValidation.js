const PRODUCT_PATTERNS = {
    name: /^[A-Za-z0-9\s()%]+$/,
    brand: /^[A-Za-z0-9\s]+$/
};

function validateProductData(productData, options = {}) {
    const {
        requireImages = false,
        validateDescriptionLength = false,
        validateSpecificationLength = false,
        emptySpecificationMessage = 'All four specifications are required'
    } = options;

    const errors = {};

    if (!productData.name) {
        errors.name = 'Product name is required';
    } else if (productData.name.length < 2 || productData.name.length > 100) {
        errors.name = 'Product name must be between 2 and 100 characters';
    } else if (!PRODUCT_PATTERNS.name.test(productData.name)) {
        errors.name = 'Product name can only contain letters, numbers, spaces, parentheses () and % symbol';
    }

    if (!productData.brand) {
        errors.brand = 'Brand is required';
    } else if (productData.brand.length < 2 || productData.brand.length > 100) {
        errors.brand = 'Brand must be between 2 and 100 characters';
    } else if (!PRODUCT_PATTERNS.brand.test(productData.brand)) {
        errors.brand = 'Brand can only contain letters, numbers, and spaces';
    }

    if (!productData.description || productData.description.replace(/\s/g, '').length === 0) {
        errors.description = 'Product description is required';
    } else if (
        validateDescriptionLength &&
        (productData.description.length > 200 || productData.description.length < 10)
    ) {
        errors.description = 'Product description must be between 10 and 200 characters';
    }

    if (!productData.category) {
        errors.category = 'Please select a category';
    }

    if (!productData.price) {
        errors.price = 'Price is required';
    } else if (Number.parseFloat(productData.price) < 50) {
        errors.price = 'Price must be at least ₹50';
    }

    if (!productData.stock) {
        errors.stock = 'Stock is required';
    } else if (Number.parseInt(productData.stock, 10) < 0) {
        errors.stock = 'Stock cannot be negative';
    }

    const hasEmptySpecification = productData.specifications.some(
        (specification) => !specification || specification.replace(/\s/g, '').length === 0
    );
    const hasInvalidSpecificationLength = productData.specifications.some(
        (specification) => specification.length < 10 || specification.length > 100
    );

    if (hasEmptySpecification) {
        errors.specifications = emptySpecificationMessage;
    } else if (validateSpecificationLength && hasInvalidSpecificationLength) {
        errors.specifications = 'Specifications must be between 10 and 100 characters';
    }

    if (requireImages && !productData.allImagesSelected) {
        errors.mainImages = 'All four images must be selected';
    }

    return errors;
}

export { validateProductData };
