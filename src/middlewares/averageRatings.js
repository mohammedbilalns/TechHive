import reviewModel from "../model/reviewModel.js";


const calculateAverageRatings = async (req, res, next) => {
    try {
        // Get all reviews
        const reviews = await reviewModel.find();
        
        // Calculate average ratings for each product
        const averageRatings = {};
        reviews.forEach(review => {
            if (!averageRatings[review.product]) {
                averageRatings[review.product] = {
                    sum: review.rating,
                    count: 1
                };
            } else {
                averageRatings[review.product].sum += review.rating;
                averageRatings[review.product].count += 1;
            }
        });

        // Convert to final averages
        const finalRatings = {};
        for (const [productId, data] of Object.entries(averageRatings)) {
            finalRatings[productId] = (data.sum / data.count).toFixed(1);
        }

        // Attach to res.locals
        res.locals.productRatings = finalRatings;

    } catch (error) {
        console.error("Error calculating average ratings:", error);
        res.locals.productRatings = {};
    }
    next();
};

export default { calculateAverageRatings };

