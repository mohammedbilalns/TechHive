import userSchema from "../../model/userModel.js";
import { log } from "mercedlogger";
import bcrypt from 'bcryptjs';
import referralCodeUtils from '../../utils/referralCode.js';
import referralModel from "../../model/referralModel.js";

const getAccountDetails = async (req, res) => {
    try {
        let email = req.session.user.email
        let user = await userSchema.findOne({ email })

        // Generate referral code 
        if (!user.referralCode) {
            user.referralCode = referralCodeUtils.generateReferralCode();
            await user.save();
        }

        // Fetch referral values
        const referralValues = await referralModel.findOne({}) || {
            referrerValue: 100,
            refereeValue: 50
        };

        res.render('user/profile/account', {
            user,
            page: "account",
            referralValues
        })
    } catch (error) {
        log.red("FETCH_ACCOUNT_DETAILS_ERROR", error)
        res.status(500).render("notfound")
    }
}

const updateProfile = async (req, res) => {
    try {
        const { fullname } = req.body;
        const userId = req.session.user.id;
        const updatedUser = await userSchema.findByIdAndUpdate(
            userId,
            { fullname },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        log.red("Error in updateProfile:", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;

        // Get user from database
        const user = await userSchema.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as current password'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        log.red("Error in changePassword:", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export default { getAccountDetails, updateProfile, changePassword };