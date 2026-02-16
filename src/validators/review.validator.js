

export const validateAddReview = ({productName, rating, comment}) => {

  productName = productName.trim();
  rating = rating.trim();
  comment = comment.trim();

  if(!productName || !rating || !comment) return "All fields are required";
  if(!rating || rating < 1 || rating > 5) return "Please provide a valid rating between 1 and 5";

  return null;

};
