import userModel from '../../model/userModel.js';
import cartModel from '../../model/cartModel.js';
import addressModel from '../../model/addressModel.js';
import walletModel from '../../model/walletModel.js';

const getCheckout = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [user, cart, addresses, wallet] = await Promise.all([
      userModel.findById(userId),
      cartModel.findOne({ user: userId }).populate('items.productId'),
      addressModel.find({ userId: userId }),
      walletModel.findOne({ userId })
    ]);
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/profile/cart');
    }

    // Check stock availability
    let stockError = false;
    let outOfStockItems = [];

    for (const item of cart.items) {
      if (item.productId.stock < item.quantity) {
        stockError = true;
        outOfStockItems.push({
          name: item.productId.name,
          available: item.productId.stock,
          requested: item.quantity
        });
      }
    }

    if (stockError) {
      req.flash('error', 'Some items in your cart are out of stock');
      return res.redirect('/profile/cart');
    }

    // Calculate totals
    let originalPrice = 0;
    let totalSavings = 0;

    cart.items.forEach(item => {
      const itemOriginalPrice = item.productId.price * item.quantity;
      const discountedPrice = itemOriginalPrice * (1 - item.productId.discount/100);
      originalPrice += itemOriginalPrice;
      totalSavings += itemOriginalPrice - discountedPrice;
    });

    const total = originalPrice - totalSavings - (cart.discount || 0);

    res.render('user/checkout', {
      user,
      cart,
      addresses,
      originalPrice,
      total,
      totalSavings,
      wallet: wallet || { balance: 0 },
      page: "cart"
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


export default {
  getCheckout
};

