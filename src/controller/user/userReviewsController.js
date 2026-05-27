import { reviewModel } from "../../model/reviewModel.js";
import { productModel } from "../../model/productModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";
import { UserReviewErrorMessages } from "../../constants/errorMessages.js";
import { UserReviewSuccessMessages } from "../../constants/successMessage.js";

const addReview = asyncHandler(async (req, res) => {
    const { productName, rating, comment } = req.body;
    const userId = req.session.user.id;

    // Format product name
    const formattedProductName = productName
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

    // Find product
    const product = await productModel.findOne({ 
      name: formattedProductName,
      status: 'Active'
    });

    if (!product) {
      throw new AppError(HttpStatus.NOT_FOUND, UserReviewErrorMessages.PRODUCT_NOT_FOUND);
    }

    // Check for existing review and update if found
    const existingReview = await reviewModel.findOne({ 
      user: userId, 
      product: product._id 
    });

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();

      return res.status(HttpStatus.OK).json({
        success: true,
        message: UserReviewSuccessMessages.REVIEW_UPDATED
      });
    }

    // Create new review if none exists
    const review = new reviewModel({
      user: userId,
      product: product._id,
      rating,
      comment
    });

    await review.save();

    res.status(HttpStatus.OK).json({
      success: true,
      message: UserReviewSuccessMessages.REVIEW_ADDED
    });
});

const getReview = asyncHandler(async (req, res) => {
    const { productName } = req.query;
    const userId = req.session.user.id;

    // Format product name
    const formattedProductName = productName
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

    // Find product
    const product = await productModel.findOne({ 
      name: formattedProductName,
      status: 'Active'
    });

    if (!product) {
      throw new AppError(HttpStatus.NOT_FOUND, UserReviewErrorMessages.PRODUCT_NOT_FOUND);
    }

    // Find review
    const review = await reviewModel.findOne({
      user: userId,
      product: product._id
    });

    if (!review) {
      throw new AppError(HttpStatus.NOT_FOUND, UserReviewErrorMessages.REVIEW_NOT_FOUND);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      review: {
        rating: review.rating,
        comment: review.comment
      }
    });
});

export default { addReview, getReview };
