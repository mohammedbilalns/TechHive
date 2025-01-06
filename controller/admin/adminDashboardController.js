import Order from '../../model/orderModel.js';


 const  getDashboardData = async (req, res)=> {
    try {
      const { filterType, startDate, endDate } = req.query;
      let dateFilter = {};

      // Create date filter based on selected type
      switch (filterType) {
        case 'daily':
          const today = new Date();
          dateFilter = {
            orderDate: {
              $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              $lte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
            }
          };
          break;
        case 'yearly':
          const year = new Date().getFullYear();
          dateFilter = {
            orderDate: {
              $gte: new Date(year, 0, 1),
              $lte: new Date(year, 11, 31)
            }
          };
          break;
        case 'monthly':
          const now = new Date();
          dateFilter = {
            orderDate: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1),
              $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
            }
          };
          break;
        case 'custom':
          dateFilter = {
            orderDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
          break;
        default:
          // Default to last 30 days
          dateFilter = {
            orderDate: {
              $gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
          };
      }

      const baseFilter = {
        ...dateFilter,
        'items.status': 'delivered'  // Only count delivered items
      };

      // Get sales data with proper calculations
      const salesData = await Order.aggregate([
        { $match: baseFilter },
        { $unwind: "$items" },
        { $match: { 'items.status': 'delivered' } },
        {
          $group: {
            _id: { 
              date: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
              orderId: "$_id"
            },
            originalAmount: { 
              $sum: { $multiply: ["$items.price", "$items.quantity"] }
            },
            offerDiscount: {
              $sum: {
                $multiply: [
                  { $multiply: ["$items.price", "$items.quantity"] },
                  { $divide: ["$items.discount", 100] }
                ]
              }
            },
            orderTotal: { $first: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } },
            couponDiscount: { $first: { $ifNull: ["$coupon.discount", 0] } }
          }
        },
        {
          $group: {
            _id: "$_id.date",
            totalSales: { $sum: "$originalAmount" },
            totalOfferDiscounts: { $sum: "$offerDiscount" },
            totalCouponDiscounts: {
              $sum: {
                $multiply: [
                  "$couponDiscount",
                  { $divide: ["$originalAmount", "$orderTotal"] }
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            totalSales: {
              $subtract: [
                "$totalSales",
                { $add: ["$totalOfferDiscounts", "$totalCouponDiscounts"] }
              ]
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get top products with proper calculations
      const topProducts = await Order.aggregate([
        { $match: baseFilter },
        { $unwind: "$items" },
        { $match: { 'items.status': 'delivered' } },
        {
          $group: {
            _id: "$items.name",
            name: { $first: "$items.name" },
            totalQuantity: { $sum: "$items.quantity" },
            originalAmount: { 
              $sum: { $multiply: ["$items.price", "$items.quantity"] }
            },
            offerDiscount: {
              $sum: {
                $multiply: [
                  { $multiply: ["$items.price", "$items.quantity"] },
                  { $divide: ["$items.discount", 100] }
                ]
              }
            }
          }
        },
        {
          $project: {
            name: 1,
            totalQuantity: 1,
            totalRevenue: {
              $subtract: ["$originalAmount", "$offerDiscount"]
            }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]);

      // Get top categories with proper calculations
      const topCategories = await Order.aggregate([
        { $match: baseFilter },
        { $unwind: "$items" },
        { $match: { 'items.status': 'delivered' } },
        {
          $lookup: {
            from: "products",
            localField: "items.name",
            foreignField: "name",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category._id",
            categoryName: { $first: "$category.name" },
            totalQuantity: { $sum: "$items.quantity" },
            originalAmount: { 
              $sum: { $multiply: ["$items.price", "$items.quantity"] }
            },
            offerDiscount: {
              $sum: {
                $multiply: [
                  { $multiply: ["$items.price", "$items.quantity"] },
                  { $divide: ["$items.discount", 100] }
                ]
              }
            }
          }
        },
        {
          $project: {
            categoryName: 1,
            totalQuantity: 1,
            totalRevenue: {
              $subtract: ["$originalAmount", "$offerDiscount"]
            }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]);

      // Get top brands with proper calculations
      const topBrands = await Order.aggregate([
        { $match: baseFilter },
        { $unwind: "$items" },
        { $match: { 'items.status': 'delivered' } },
        {
          $group: {
            _id: "$items.brand",
            totalQuantity: { $sum: "$items.quantity" },
            originalAmount: { 
              $sum: { $multiply: ["$items.price", "$items.quantity"] }
            },
            offerDiscount: {
              $sum: {
                $multiply: [
                  { $multiply: ["$items.price", "$items.quantity"] },
                  { $divide: ["$items.discount", 100] }
                ]
              }
            }
          }
        },
        {
          $project: {
            totalQuantity: 1,
            totalRevenue: {
              $subtract: ["$originalAmount", "$offerDiscount"]
            }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        salesData,
        topProducts,
        topCategories,
        topBrands,
      });

    } catch (error) {
      console.error('Dashboard Data Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data'
      });
    }
  }

 const renderDashboard = async(req, res)=>{
    try {
      res.render('admin/dashboard', {page:"dashboard"});
    } catch (error) {
      console.error('Dashboard Render Error:', error);
      res.status(500).send('Error loading dashboard');
    }
  }


export default { getDashboardData , renderDashboard};
