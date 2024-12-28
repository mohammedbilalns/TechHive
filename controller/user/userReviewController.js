import reviewModel from "../../model/reviewModel.js";
import productModel from "../../model/productModel.js";
import { log } from "mercedlogger";

const addReview = async (req, res) => {
    try {
        const { productName, rating, comment } = req.body;
        const userId = req.session.user.id;

        // Validate input
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid rating between 1 and 5"
            });
        }

        if (!comment || comment.length < 10 || comment.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Review must be between 10 and 100 characters"
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
            return res.status(404).json({
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

            return res.json({
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

        res.json({
            success: true,
            message: "Review added successfully"
        });

    } catch (error) {
        log.red("ADD_REVIEW_ERROR", error);
        res.status(500).json({
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
            return res.status(404).json({
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
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        res.json({
            success: true,
            review: {
                rating: review.rating,
                comment: review.comment
            }
        });

    } catch (error) {
        log.red("GET_REVIEW_ERROR", error);
        res.status(500).json({
            success: false,
            message: "Error fetching review"
        });
    }
};

export default { addReview, getReview };

