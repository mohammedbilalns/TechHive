function toggleCustomDateRange(filterTypeElement, customDateRangeElement) {
    if (!filterTypeElement || !customDateRangeElement) return;

    const isCustom = filterTypeElement.value === 'custom';
    customDateRangeElement.classList.toggle('hidden', !isCustom);
    customDateRangeElement.classList.toggle('flex', isCustom);
}

function setupDateRangeFilter({
    filterTypeId = 'filterType',
    customDateRangeId = 'customDateRange',
} = {}) {
    const filterTypeElement = document.getElementById(filterTypeId);
    const customDateRangeElement = document.getElementById(customDateRangeId);

    if (!filterTypeElement || !customDateRangeElement) {
        return { filterTypeElement: null, customDateRangeElement: null };
    }

    filterTypeElement.addEventListener('change', () => {
        toggleCustomDateRange(filterTypeElement, customDateRangeElement);
    });

    toggleCustomDateRange(filterTypeElement, customDateRangeElement);

    return { filterTypeElement, customDateRangeElement };
}

function getDateRangeParams({
    filterTypeId = 'filterType',
    startDateId = 'startDate',
    endDateId = 'endDate',
    onError = () => {},
} = {}) {
    const filterType = document.getElementById(filterTypeId)?.value;
    const startDate = document.getElementById(startDateId)?.value;
    const endDate = document.getElementById(endDateId)?.value;

    if (filterType === 'custom') {
        if (!startDate || !endDate) {
            onError('Please select both start and end dates');
            return null;
        }

        if (new Date(startDate) > new Date(endDate)) {
            onError('Start date cannot be after end date');
            return null;
        }
    }

    return {
        filterType,
        startDate: filterType === 'custom' ? startDate : undefined,
        endDate: filterType === 'custom' ? endDate : undefined,
    };
}

export { getDateRangeParams, setupDateRangeFilter };
