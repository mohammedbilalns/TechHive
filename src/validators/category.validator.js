export const validateCategory = ({ name, description }) => {
  if (!name || !name.trim()) {
    return { error: "Category name is required" };
  }
  if (!description || !description.trim()) {
    return { error: "Description is required" };
  }

  // Sanitization
  const sanitizedName =
    name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
  const sanitizedDescription = description.trim();

  if (sanitizedName.length < 3 || sanitizedName.length > 100) {
    return { error: "Category name must be between 3-100 characters" };
  }

  if (sanitizedDescription.length < 10 || sanitizedDescription.length > 500) {
    return { error: "Description must be between 10-500 characters" };
  }

  return {
    error: null,
    value: {
      name: sanitizedName,
      description: sanitizedDescription,
    },
  };
};
