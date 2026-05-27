import { wishlistModel } from "../../model/wishlistModel.js";
import { productModel } from "../../model/productModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { AppError } from "../../utils/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ErrorMessages } from "../../constants/errorMessages.js";
import { SuccessMessage } from "../../constants/successMessage.js";

const getWishlist = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const userId = req.session.user.id;

    // Find or create wishlist
    let wishlist = await wishlistModel.findOne({ userId });
    if (!wishlist) {
        wishlist = await wishlistModel.create({ userId, products: [] });
    }

    // Get total count for pagination
    const totalProducts = wishlist.products.length;
    const totalPages = Math.ceil(totalProducts / limit);

    // Get paginated wishlist
    const paginatedWishlist = await wishlistModel.findOne({ userId })
        .populate({
            path: 'products',
            match: { status: 'Active' },
            options: {
                skip: skip,
                limit: limit
            }
        });

    res.render('user/profile/wishlist', {
        wishlist: paginatedWishlist ? paginatedWishlist : [],
        page: "wishlist",
        user: req.session.user,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    });
});

const addToWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const userId = req.session.user.id;

    // Check if product is active
    const product = await productModel.findOne({
        _id: productId,
        status: 'Active'
    });

    if (!product) {
        throw new AppError(HttpStatus.BAD_REQUEST, ErrorMessages.PRODUCT_NOT_AVAILABLE);
    }

    let wishlist = await wishlistModel.findOne({ userId });

    if (!wishlist) {
        wishlist = await wishlistModel.create({
            userId,
            products: [productId]
        });
    } else if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
        await wishlist.save();
    }

    const totalQuantity = wishlist.products.length;

    res.status(HttpStatus.OK).json({
        success: true,
        message: SuccessMessage.PRODUCT_ADDED_TO_WISHLIST,
        totalQuantity
    });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const userId = req.session.user.id;

    const wishlist = await wishlistModel.findOne({ userId });

    if (!wishlist) {
        throw new AppError(HttpStatus.NOT_FOUND, ErrorMessages.WISHLIST_NOT_FOUND);
    }

    // Remove the product from the wishlist
    wishlist.products = wishlist.products.filter(
        product => product.toString() !== productId
    );

    await wishlist.save();

    const totalQuantity = wishlist.products.length;

    res.status(HttpStatus.OK).json({
        success: true,
        message: SuccessMessage.PRODUCT_REMOVED_FROM_WISHLIST,
        totalQuantity
    });
});

export default { getWishlist, addToWishlist, removeFromWishlist };
