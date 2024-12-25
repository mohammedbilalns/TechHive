import { log } from "mercedlogger";
import Coupon from "../../model/couponModel.js";

const getCoupons = async (req, res) => {
    try {
        const currentDate = new Date();
        const userId = req.session.user.id;

        // Fetch all active coupons
        const allCoupons = await Coupon.find({
            isActive: true
        }).lean();

        // Categorize coupons
        const coupons = {
            available: [],
            used: [],
            expired: []
        };

        // Process each coupon
        allCoupons.forEach(coupon => {
            try {
                const expiryDate = new Date(coupon.expiryDate);
                const startDate = new Date(coupon.startDate);
                
                // Check if coupon is used by current user
                const userUsage = coupon.usageHistory?.find(usage => 
                    usage.userId?.toString() === userId.toString()
                );

                // Check if coupon is expired
                if (expiryDate < currentDate) {
                    coupons.expired.push({
                        ...coupon,
                        usedDate: userUsage?.usedAt
                    });
                    return;
                }

                // Check if start date is in future
                if (startDate > currentDate) {
                    return;
                }

                // If used by user, add to used category
                if (userUsage) {
                    coupons.used.push({
                        ...coupon,
                        usedDate: userUsage.usedAt
                    });
                    return;
                }

                // If not expired, not in future, and not used, coupon is available
                coupons.available.push(coupon);
            } catch (err) {
                log.red("COUPON_PROCESSING_ERROR", err);
            }
        });

        res.render('user/profile/coupons', {
            user: req.session.user,
            title: 'Available Coupons',
            page: "coupons",
            coupons,
            currentDate
        });

    } catch (error) {
        log.red("GET_COUPONS_ERROR", error);
        res.status(500).render('error', {
            message: 'Failed to fetch coupons',
            error: {
                status: 500,
            }
        });
    }
};

export default {
    getCoupons
};
