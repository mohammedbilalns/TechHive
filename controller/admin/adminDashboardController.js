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

      // Get sales data
      const salesData = await Order.aggregate([
        { $match: baseFilter },
        { $unwind: "$items" },
        { $match: { 'items.status': 'delivered' } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get top products
      const topProducts = await Order.aggregate([
        { $match: baseFilter },
        { $unwind: "$items" },
        { $match: { 'items.status': 'delivered' } },
        {
          $group: {
            _id: "$items.name",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
          }
        },
        {
          $project: {
            name: "$_id",
            totalQuantity: 1,
            totalRevenue: 1,
            averagePrice: { $divide: ["$totalRevenue", "$totalQuantity"] }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]);

      // Get top categories
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
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            totalQuantity: { $sum: "$items.quantity" }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]);

      // Get top brands
      const topBrands = await Order.aggregate([
        { $match: baseFilter },
        { $unwind: "$items" },
        { $match: { 'items.status': 'delivered' } },
        {
          $group: {
            _id: "$items.brand",
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            totalQuantity: { $sum: "$items.quantity" }
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
