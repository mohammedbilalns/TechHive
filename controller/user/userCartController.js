import cartSchema from "../../model/cartModel.js"
import productSchema from "../../model/productModel.js"
import { log } from "mercedlogger"

const getCart = async (req, res) => {
    try {
        delete req.session.coupon;
        
        const userId = req.session.user.id;
        const cart = await cartSchema.findOne({ user: userId })
            .populate('items.productId');

        // Create cart if not found
        if (!cart) {
            cart = await cartSchema.create({
                user: userId,
                items: []
            });
        }

        // Calculate cart totals
        let subtotal = 0;
        let originalPrice = 0;

        if (cart.items && cart.items.length > 0) {
            cart.items.forEach(item => {
                const itemOriginalPrice = item.productId.price * item.quantity;
                const discountedPrice = itemOriginalPrice * (1 - item.productId.discount / 100);

                originalPrice += itemOriginalPrice;
                subtotal += discountedPrice;
            });
        }

        const totalDiscount = originalPrice - subtotal;
        const shipping = 0;
        const total = subtotal;

        res.render('user/profile/cart', {
            cart,
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            total: total.toFixed(2),
            originalPrice: originalPrice.toFixed(2),
            totalDiscount: totalDiscount.toFixed(2),
            user: req.session.user,
            page: 'cart'
        });
    } catch (error) {
        log.red("GET_CART_ERROR:", error);
        res.status(500).render('user/profile/cart', {
            message: "Error loading cart",
            alertType: "error",
            user: req.session.user,
            cart: null,
            subtotal: "0.00",
            shipping: "0.00",
            total: "0.00"
        });
    }
}

const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user.id;

        // Check if product exists, has stock, and is active
        const product = await productSchema.findById(productId);
        if (!product || product.stock <= 0 || product.status !== 'Active') {
            return res.status(400).json({
                success: false,
                message: !product ? "Product not found" :
                    product.status !== 'Active' ? "Product is not available" :
                        "Product is out of stock"
            });
        }

        // Find and create cart
        let cart = await cartSchema.findOne({ user: userId });
        if (!cart) {
            cart = await cartSchema.create({
                user: userId,
                items: []
            });
        }

        // Check if product already in cart
        const existingItem = cart.items.find(
            item => item.productId.toString() === productId
        );

        if (existingItem) {
            if (existingItem.quantity >= 4) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum quantity limit reached"
                });
            }
            if (existingItem.quantity >= product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Not enough stock available"
                });
            }
            existingItem.quantity += 1;

        } else {
            cart.items.push({
                productId,
                quantity: 1
            });
        }

        await cart.save();

        const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0)

        return res.status(200).json({
            success: true,
            message: "Product added to cart successfully",
            totalQuantity
        });



    } catch (error) {
        log.red("ADDTO_CART_ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Error adding product to cart"
        });
    }
}

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.session.user.id;

        const cart = await cartSchema.findOne({ user: userId })
            .populate('items.productId');

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Remove the item from cart
        cart.items = cart.items.filter(item =>
            item.productId._id.toString() !== productId
        );

        await cart.save();

        // Calculate new totals
        let subtotal = 0;
        let originalPrice = 0;

        cart.items.forEach(item => {
            const itemOriginalPrice = item.productId.price * item.quantity;
            const discountedPrice = itemOriginalPrice * (1 - item.productId.discount / 100);
            originalPrice += itemOriginalPrice;
            subtotal += discountedPrice;
        });

        const totalDiscount = originalPrice - subtotal;
        const total = subtotal - (cart.discount || 0);
        const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        res.status(200).json({
            success: true,
            totalQuantity,
            subtotal: subtotal.toFixed(2),
            total: total.toFixed(2),
            originalPrice: originalPrice.toFixed(2),
            totalDiscount: totalDiscount.toFixed(2),
            message: "Item removed successfully"
        });
    } catch (error) {
        log.red("REMOVE_FROM_CART_ERROR", error);
        res.status(500).json({
            success: false,
            message: "Error removing product from cart"
        });
    }
}

const updateQuantity = async (req, res) => {
    try {
        const { productId, action } = req.body;
        const userId = req.session.user.id;

        // Find cart and populate product details
        const cart = await cartSchema.findOne({ user: userId })
            .populate('items.productId');

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Find product
        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Find item in cart
        const cartItem = cart.items.find(item =>
            item.productId._id.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        // Update quantity
        let newQuantity = cartItem.quantity;
        if (action === 'increase') {
            if (cartItem.quantity >= 4) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum quantity limit reached"
                });
            }
            if (cartItem.quantity >= product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Not enough stock available"
                });
            }
            newQuantity = cartItem.quantity + 1;
        } else if (action === 'decrease') {
            if (cartItem.quantity <= 1) {
                cart.items = cart.items.filter(item =>
                    item.productId._id.toString() !== productId
                );
            } else {
                newQuantity = cartItem.quantity - 1;
            }
        }

        // Update cart item quantity if not removed
        if (cart.items.find(item => item.productId._id.toString() === productId)) {
            cartItem.quantity = newQuantity;
        }

        // Save cart
        await cart.save();

        // Calculate new totals
        let subtotal = 0;
        let originalPrice = 0;

        cart.items.forEach(item => {
            const itemOriginalPrice = item.productId.price * item.quantity;
            const discountedPrice = itemOriginalPrice * (1 - item.productId.discount / 100);
            originalPrice += itemOriginalPrice;
            subtotal += discountedPrice;
        });

        const totalDiscount = originalPrice - subtotal;
        const total = subtotal - (cart.discount || 0);
        const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        return res.status(200).json({
            success: true,
            subtotal: subtotal.toFixed(2),
            total: total.toFixed(2),
            originalPrice: originalPrice.toFixed(2),
            totalDiscount: totalDiscount.toFixed(2),
            totalQuantity,
            message: "Cart updated successfully"
        });

    } catch (error) {
        log.red("UPDATE_QUANTITY_ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Error updating cart quantity"
        });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Find and remove all items from cart
        const cart = await cartSchema.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.items = [];
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully"
        });

    } catch (error) {
        log.red("CLEAR_CART_ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Error clearing cart"
        });
    }
};

export default {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
}
