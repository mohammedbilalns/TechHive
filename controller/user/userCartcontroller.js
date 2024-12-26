import cartSchema from "../../model/cartModel.js"
import userSchema from "../../model/userModel.js"
import productSchema from "../../model/productModel.js"
import {log} from "mercedlogger"
import couponSchema from "../../model/couponModel.js"

const getCart = async (req, res) => {
    try {
        const cart = await cartSchema.findOne({ user: req.session.user.id })
            .populate('items.productId');
        
        if (!cart) {
            return res.render('user/profile/cart', {
                cart: null,
                subtotal: "0.00",
                shipping: "0.00",
                total: "0.00",
                originalPrice: "0.00",
                totalDiscount: "0.00",
                user: req.session.user
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
        const total = subtotal - (cart.discount || 0);

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

        const totalQuantity = cart.items.reduce((sum , item)=> sum+ item.quantity,0)
        
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
        const { productId } = req.body;
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

const applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.session.user.id;

        // Find the cart
        const cart = await cartSchema.findOne({ user: userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Find the coupon
        const coupon = await couponSchema.findOne({ 
            code: code.toUpperCase(),
            isActive: true,
            expiryDate: { $gt: new Date() }
        });
        
        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired coupon code"
            });
        }

        // Check user's usage count of this coupon
        const userUsageCount = coupon.usageHistory?.filter(usage => 
            usage.userId.toString() === userId.toString()
        ).length || 0;

        if (userUsageCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: "You have reached the usage limit for this coupon"
            });
        }

        // Calculate cart subtotal
        let subtotal = 0;
        cart.items.forEach(item => {
            const itemPrice = item.productId.price * (1 - item.productId.discount/100);
            subtotal += itemPrice * item.quantity;
        });
    
        // Check minimum purchase requirement
        if (subtotal < coupon.minPurchase) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase of ₹${coupon.minPurchase} required`
            });
        }

        // Calculate discount
        let discountAmount;
        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        // Update cart with discount
        cart.couponCode = code.toUpperCase();
        cart.discount = discountAmount;
        await cart.save();
    
        // Calculate final total
        const total = subtotal - discountAmount;
    
        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            discount: discountAmount.toFixed(2),
            total: total.toFixed(2),
            couponCode: coupon.code
        });

    } catch (error) {
        log.red("APPLY_COUPON_ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Error applying coupon"
        });
    }
};

const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cart = await cartSchema.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.discount = 0;
        cart.couponCode = null
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Coupon removed successfully"
        });

    } catch (error) {
        log.red("REMOVE_COUPON_ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Error removing coupon"
        });
    }
};

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
                // Remove item if quantity would be less than 1
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
    applyCoupon,
    removeCoupon,
    clearCart
}
