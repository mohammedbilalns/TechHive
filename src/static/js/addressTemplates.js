function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createCheckoutAddressCard(address, { checked = false } = {}) {
  return `
        <div class="border rounded-lg p-4 relative">
            <input
                type="radio"
                name="selectedAddress"
                value="${escapeHtml(address._id)}"
                class="absolute right-4 top-4"
                ${checked ? "checked" : ""}
            >
            <h3 class="font-semibold">${escapeHtml(address.name)}</h3>
            <p class="text-gray-600">
                ${escapeHtml(address.houseName)}
                ${escapeHtml(address.localityStreet)}<br>
                ${escapeHtml(address.city)}, ${escapeHtml(address.state)}
                ${escapeHtml(address.pincode)}<br>
                Phone: ${escapeHtml(address.phone)}
            </p>
            <div class="mt-2">
                <button onclick="editAddress('${escapeHtml(address._id)}')" class="text-primary-accent hover:underline mr-2">
                    Edit
                </button>
            </div>
        </div>
    `;
}

function createProfileAddressCard(address) {
  const labelMarkup = address.label
    ? `<span class="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">${escapeHtml(address.label)}</span>`
    : '<span class="inline-block"></span>';

  return `
        <div class="border rounded-lg p-4" data-address-id="${escapeHtml(address._id)}">
            <div class="flex justify-between items-start mb-2">
                ${labelMarkup}
                <div class="flex space-x-2">
                    <button onclick="editAddress('${escapeHtml(address._id)}')" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteAddress('${escapeHtml(address._id)}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="font-semibold">${escapeHtml(address.name)}</p>
            <p class="font-semibold">${escapeHtml(address.houseName)}</p>
            <p class="text-gray-600">${escapeHtml(address.localityStreet)}</p>
            <p class="text-gray-600">${escapeHtml(address.city)}, ${escapeHtml(address.state)}</p>
            <p class="text-gray-600">PIN: ${escapeHtml(address.pincode)}</p>
            <p class="text-gray-600">Phone: ${escapeHtml(address.phone)}</p>
        </div>
    `;
}

export { createCheckoutAddressCard, createProfileAddressCard };
