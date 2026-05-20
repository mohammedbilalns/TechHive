import { reviewModel } from "../../model/reviewModel.js";
import { productModel } from "../../model/productModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import logger from "../../utils/logger.js";

const addReview = async (req, res) => {
  try {
    const { productName, rating, comment } = req.body;
    const userId = req.session.user.id;


    if(error){
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error
      });
    }

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
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Product not found"
      });
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
        message: "Review updated successfully"
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
      message: "Review added successfully"
    });

  } catch (error) {
    logger.error("ADD_REVIEW_ERROR", error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error adding review"
    });
  }
};

const getReview = async (req, res) => {
  try {
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
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Product not found"
      });
    }

    // Find review
    const review = await reviewModel.findOne({
      user: userId,
      product: product._id
    });

    if (!review) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Review not found"
      });
    }

    res.status(HttpStatus.OK).json({
      success: true,
      review: {
        rating: review.rating,
        comment: review.comment
      }
    });

  } catch (error) {
    logger.error("GET_REVIEW_ERROR", error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching review"
    });
  }
};

export default { addReview, getReview };
