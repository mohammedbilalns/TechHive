import walletModel from '../../model/walletModel.js';
import userModel from '../../model/userModel.js';
import { nanoid } from 'nanoid';

const getWallet = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const wallet = await walletModel.findOne({ userId: req.session.user.id });
        const user =  await userModel.findOne({_id: req.session.user.id})
        console.log(user)
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
        console.error('Get wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet details'
        });
    }
};

const addMoney = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        const wallet = await walletModel.findOne({ userId: req.session.user.id });
        
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        // Add transaction
        wallet.balance += Number(amount);
        wallet.transactions.push({
            transactionId: 'TXN' + nanoid(8).toUpperCase(),
            type: 'CREDIT',
            amount: amount,
            description: 'Added money to wallet',
            date: new Date()
        });

        await wallet.save();

        res.json({
            success: true,
            message: 'Money added successfully',
            newBalance: wallet.balance
        });

    } catch (error) {
        console.error('Add money error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding money to wallet'
        });
    }
};

export default {
    getWallet,
    addMoney
};
