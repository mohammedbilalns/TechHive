export const validateOffer = ({
  name,
  offerType,
  offerPercentage,
  startDate,
  endDate,
  categories,
  products,
}) => {
  name = name?.trim();

  if (!name || !offerType || !offerPercentage || !startDate || !endDate) {
    return "All fields are required";
  }

  if (offerType === "category" && (!categories || categories.length === 0)) {
    return "At least one category must be selected";
  }

  if (offerType === "product" && (!products || products.length === 0)) {
    return "At least one product must be selected";
  }

  if (name.length < 3 || name.length > 50) {
    return "Offer name must be between 3 and 50 characters";
  }

  if (offerPercentage < 1 || offerPercentage > 99) {
    return "Offer percentage must be between 1 and 99";
  }

  if (new Date(startDate) > new Date(endDate)) {
    return "Start date cannot be greater than end date";
  }

  return null;
};
