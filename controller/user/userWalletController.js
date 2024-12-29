import walletModel from '../../model/walletModel.js';
import userModel from '../../model/userModel.js';
import { nanoid } from 'nanoid';
import razorpay from '../../utils/razorpayConfig.js';
import crypto from 'crypto';
import { log } from 'mercedlogger';

const getWallet = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const wallet = await walletModel.findOne({ userId: req.session.user.id });
        const user =  await userModel.findOne({_id: req.session.user.id})
      
        if (!wallet) {
            // Create wallet if it doesn't exist
            const newWallet = new walletModel({
                userId: req.session.user.id,
                balance: 0,
                transactions: []
            });
            await newWallet.save();
            return res.render('user/profile/wallet', {
                wallet: newWallet,
                user,
                currentPage: 1,
                totalPages: 1,
                page:"wallet"
            });
        }

        // Get total count for pagination
        const totalTransactions = wallet.transactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);

        // Get paginated transactions
        const transactions = wallet.transactions
            .sort((a, b) => b.date - a.date)
            .slice(skip, skip + limit);

        res.render('user/profile/wallet', {
            wallet: {
                ...wallet.toObject(),
                transactions
            },
            user,
            currentPage: page,
            totalPages,
            page:"wallet"
        });

    } catch (error) {
        log.red('GET_WALLET_ERROR', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet details'
        });
    }
};

const addMoney = async (req, res) => {
    try {
        const { amount } = req.body;
        const numAmount = parseFloat(amount);
        
        if (!numAmount || numAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Create Razorpay order
        const orderOptions = {
            amount: Math.round(numAmount * 100), // Convert to paise
            currency: 'INR',
            receipt: 'wallet_' + nanoid(8)
        };

        console.log('Creating Razorpay order with options:', orderOptions);

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        console.log('Razorpay order created:', razorpayOrder);

        res.json({
            success: true,
            amount: razorpayOrder.amount,
            razorpayOrderId: razorpayOrder.id
        });

    } catch (error) {
        log.red('ADD_MONEY_ERROR', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating payment order'
        });
    }
};

const verifyWalletPayment = async (req, res) => {
    try {
        
        const { 
            razorpay_payment_id, 
            razorpay_order_id,
            razorpay_signature,
            amount 
        } = req.body;

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const wallet = await walletModel.findOne({ userId: req.session.user.id });
            
            if (!wallet) {
                return res.json({ success: false, message: 'Wallet not found' });
            }

            // Add money to wallet
            const amountInRupees = amount / 100; // Convert from paise to rupees
            wallet.balance += amountInRupees;
            wallet.transactions.push({
                transactionId: 'TXN' + nanoid(8).toUpperCase(),
                type: 'CREDIT',
                amount: amountInRupees,
                description: 'Added money to wallet',
                date: new Date()
            });

            await wallet.save();

            res.json({ 
                success: true,
                message: 'Payment verified and wallet updated successfully',
                newBalance: wallet.balance
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Payment verification failed' 
            });
        }
    } catch (error) {
        log.red('PAYMENT_VERIFICATION_ERROR', error);
        res.json({ 
            success: false, 
            message: 'Payment verification failed' 
        });
    }
};

export default {
    getWallet,
    addMoney,
    verifyWalletPayment
};
