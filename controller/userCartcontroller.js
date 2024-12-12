import cartSchema from "../model/cartModel.js"
import userSchema from "../model/userModel.js"
import productSchema from "../model/productModel.js"

const getCart = async (req, res) => {
    try {
        const cart = await cartSchema.findOne({ user: req.session.user.id })
            .populate('items.productId');

        if (!cart) {
            return res.render('user/cart', {
                cart: null,
                subtotal: "0.00",
                shipping: "0.00",
                total: "0.00",
                user: req.session.user
            });
        }

        // Calculate cart totals
        let subtotal = 0;
        if (cart.items && cart.items.length > 0) {
            subtotal = cart.items.reduce((total, item) => {
                if (item.productId) {
                    const discountedPrice = item.productId.price * (1 - item.productId.discount / 100);
                    return total + (discountedPrice * item.quantity);
                }
                return total;
            }, 0);
        }

        const shipping = 0; // Free shipping
        const total = subtotal + shipping;

        res.render('user/cart', {
            cart,
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            total: total.toFixed(2),
            user: req.session.user
        });
    } catch (error) {
        console.error("Get cart error:", error);
        res.status(500).render('user/cart', {
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

        // Check if product exists and has stock
        const product = await productSchema.findById(productId);
        if (!product || product.stock <= 0) {
            return res.status(400).json({
                success: false,
                message: product ? "Product is out of stock" : "Product not found"
            });
        }

        // Find or create cart
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
        return res.status(200).json({
            success: true,
            message: "Product added to cart successfully"
        });

    } catch (error) {
        console.error("Add to cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Error adding product to cart"
        });
    }
}

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user.id;

        const cart = await cartSchema.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // Remove the item from cart
        cart.items = cart.items.filter(item =>
            item.productId.toString() !== productId
        );

        await cart.save();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).json({
            success: false,
            message: "Error removing product from cart"
        });
    }
}

const applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.session.user.id;

        return res.status(200).json({
            success: false,
            message: "Coupon functionality not implemented yet"
        });


    } catch (error) {
        log.red("APPLY_COUPON_ERROR", error);
        res.status(500).json({
            success: false,
            message: "Error applying coupon"
        });
    }
}

const updateQuantity = async (req, res) => {
    try {
        const { productId, action } = req.body;
        const userId = req.session.user.id;

        const cart = await cartSchema.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Find the product
        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Find the item in cart
        const cartItem = cart.items.find(item =>
            item.productId.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        // Handle quantity update
        if (action === 'increase') {
            // Check maximum limit
            if (cartItem.quantity >= 4) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum quantity limit (4) reached"
                });
            }
            // Check stock availability
            if (cartItem.quantity >= product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Not enough stock available"
                });
            }
            cartItem.quantity += 1;
        } else if (action === 'decrease') {
            if (cartItem.quantity <= 1) {
                // Remove item if quantity would go below 1
                cart.items = cart.items.filter(item =>
                    item.productId.toString() !== productId
                );
            } else {
                cartItem.quantity -= 1;
            }
        }

        // Save cart changes
        await cart.save();

        // Calculate new totals
        const updatedCart = await cartSchema.findOne({ user: userId })
            .populate('items.productId');

        let subtotal = 0;
        if (updatedCart && updatedCart.items.length > 0) {
            subtotal = updatedCart.items.reduce((total, item) => {
                if (item.productId) {
                    const price = item.productId.price * (1 - item.productId.discount / 100);
                    return total + (price * item.quantity);
                }
                return total;
            }, 0);
        }

        return res.status(200).json({
            success: true,
            subtotal: subtotal.toFixed(2),
            total: subtotal.toFixed(2),
            message: "Cart updated successfully"
        });

    } catch (error) {
        console.error("Update quantity error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating cart quantity"
        });
    }
}

export default {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    applyCoupon
}