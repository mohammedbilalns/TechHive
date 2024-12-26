import { log } from "mercedlogger";
import Coupon from "../../model/couponModel.js";

const getCoupons = async (req, res) => {
    try {
        const currentDate = new Date();
        const userId = req.session.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        const allCoupons = await Coupon.find({
            isActive: true
        }).lean();

        const categorizedCoupons = {
            available: [],
            used: [],
            expired: []
        };

        allCoupons.forEach(coupon => {
            try {
                const expiryDate = new Date(coupon.expiryDate);
                const startDate = new Date(coupon.startDate);
                
                // Count how many times this user has used the coupon
                const userUsageCount = coupon.usageHistory?.filter(usage => 
                    usage.userId?.toString() === userId.toString()
                ).length || 0;

                // Calculate remaining uses for this user
                const remainingUses = coupon.usageLimit - userUsageCount;

                if (expiryDate < currentDate) {
                    categorizedCoupons.expired.push({
                        ...coupon,
                        usedDate: coupon.usageHistory?.find(usage => 
                            usage.userId?.toString() === userId.toString()
                        )?.usedAt,
                        remainingUses
                    });
                    return;
                }

                if (startDate > currentDate) {
                    return;
                }

                // Only consider a coupon "used" if this user has no remaining uses
                if (remainingUses <= 0) {
                    categorizedCoupons.used.push({
                        ...coupon,
                        usedDate: coupon.usageHistory?.find(usage => 
                            usage.userId?.toString() === userId.toString()
                        )?.usedAt,
                        remainingUses: 0
                    });
                    return;
                }

                // If there are remaining uses for this user, show as available
                categorizedCoupons.available.push({
                    ...coupon,
                    remainingUses,
                    userUsedDate: coupon.usageHistory?.find(usage => 
                        usage.userId?.toString() === userId.toString()
                    )?.usedAt
                });
            } catch (err) {
                log.red("COUPON_PROCESSING_ERROR", err);
            }
        });

        // Combine all coupons in desired order
        const combinedCoupons = [
            ...categorizedCoupons.available,
            ...categorizedCoupons.used,
            ...categorizedCoupons.expired
        ];

        // Calculate pagination
        const totalCoupons = combinedCoupons.length;
        const totalPages = Math.ceil(totalCoupons / limit);

        // Get paginated coupons
        const paginatedCoupons = combinedCoupons.slice(skip, skip + limit);

        res.render('user/profile/coupons', {
            user: req.session.user,
            title: 'My Coupons',
            page: "coupons",
            coupons: paginatedCoupons,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
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
