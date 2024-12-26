import { log } from "mercedlogger";
import Coupon from "../../model/couponModel.js";

const getCoupons = async (req, res) => {
    try {
        const currentDate = new Date();
        const userId = req.session.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 9; // Show 9 coupons per page (3x3 grid)
        const skip = (page - 1) * limit;

        // Fetch all active coupons
        const allCoupons = await Coupon.find({
            isActive: true
        }).lean();

        // Categorize coupons
        const categorizedCoupons = {
            available: [],
            used: [],
            expired: []
        };

        // Process each coupon
        allCoupons.forEach(coupon => {
            try {
                const expiryDate = new Date(coupon.expiryDate);
                const startDate = new Date(coupon.startDate);
                
                const userUsage = coupon.usageHistory?.find(usage => 
                    usage.userId?.toString() === userId.toString()
                );

                if (expiryDate < currentDate) {
                    categorizedCoupons.expired.push({
                        ...coupon,
                        usedDate: userUsage?.usedAt
                    });
                    return;
                }

                if (startDate > currentDate) {
                    return;
                }

                if (userUsage) {
                    categorizedCoupons.used.push({
                        ...coupon,
                        usedDate: userUsage.usedAt
                    });
                    return;
                }

                categorizedCoupons.available.push(coupon);
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
