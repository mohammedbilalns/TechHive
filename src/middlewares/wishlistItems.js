import { wishlistModel } from "../model/wishlistModel.js";
import logger from "../utils/logger.js";

const fetchWishlistItems = async (req, res, next) => {
  try {
    if (req.session.user) {
      const userId = req.session.user.id;

      let wishlist = await wishlistModel.findOne({ userId }).populate({
        path: "products",
        match: { status: "Active" },
      }).lean();

      // Create new wishlist if none exists
      if (!wishlist) {
        wishlist = await wishlistModel.create({ userId, products: [] });
      }

      res.locals.wishlistItems = wishlist.products.map(
        (product) => product._id,
      );
      res.locals.wishlistQuantity = wishlist.products.length;
    } else {
      res.locals.wishlistItems = [];
      res.locals.wishlistQuantity = 0;
    }
  } catch (error) {
    logger.error("FETCH_WISHLIST_ERROR", error);
    res.locals.wishlistItems = [];
  }

  next();
};

export default { fetchWishlistItems };
