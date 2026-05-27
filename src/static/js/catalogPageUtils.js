function generateStarRating(rating) {
  let stars = "";

  for (let index = 1; index <= 5; index += 1) {
    const colorClass =
      index <= Math.floor(rating) ? "text-yellow-400" : "text-gray-300";
    stars += `<svg class="w-4 h-4 ${colorClass}" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>`;
  }

  return stars;
}

function generatePriceHTML(product, options = {}) {
  const {
    currentPriceClass = "",
    originalPriceClass = "text-gray-400 line-through text-sm",
    wrapperClass = "",
  } = options;

  if (product.discount > 0) {
    const discountedPrice = (
      product.price *
      (1 - product.discount / 100)
    ).toFixed(2);
    return `
            <div class="${wrapperClass}">
                <p class="${currentPriceClass}">₹${discountedPrice}</p>
                <p class="${originalPriceClass}">₹${product.price.toFixed(2)}</p>
            </div>`;
  }

  return `<p class="${currentPriceClass}">₹${product.price.toFixed(2)}</p>`;
}

function createPriceRangeHandlers({
  minInput,
  maxInput,
  onValidRange,
  onInvalidRange,
  delay = 500,
}) {
  let timeoutId;

  function validatePriceRange() {
    const minPrice = Number.parseFloat(minInput.value) || 0;
    const maxPrice = Number.parseFloat(maxInput.value) || 0;

    if (maxPrice && minPrice > maxPrice) {
      maxInput.value = "";
      onInvalidRange();
      return false;
    }

    return true;
  }

  function handlePriceChange() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const minPrice = Number.parseFloat(minInput.value) || 0;
      const maxPrice = Number.parseFloat(maxInput.value) || 0;

      if (!maxPrice || minPrice <= maxPrice) {
        onValidRange({
          minPrice: minPrice || "",
          maxPrice: maxPrice || "",
        });
      }
    }, delay);
  }

  return {
    handlePriceChange,
    validatePriceRange,
  };
}

export { createPriceRangeHandlers, generatePriceHTML, generateStarRating };
