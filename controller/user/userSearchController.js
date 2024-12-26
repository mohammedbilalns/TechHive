import { log } from "mercedlogger";
import productSchema from "../../model/productModel.js";
import categorySchema from "../../model/categoryModel.js";

const searchProducts = async (req, res) => {
    try {
        const query = req.query.q;
        const sortBy = req.query.sort || 'featured';

        const matchingCategories = await categorySchema.find({
            name: { $regex: query, $options: 'i' },
            status: 'Active'
        });

        const categoryIds = matchingCategories.map(cat => cat._id);

        const baseQuery = {
            status: "Active",
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { brand: { $regex: query, $options: 'i' } },
                { category: { $in: categoryIds } }
            ]
        };

        let sortOptions = {};
        switch (sortBy) {
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            case 'price_asc':
                sortOptions = { price: 1 };
                break;
            case 'price_desc':
                sortOptions = { price: -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'name_desc':
                sortOptions = { name: -1 };
                break;
            case 'rating':
                sortOptions = { rating: -1 };  // not implemented 
                break;
            default:
                sortOptions = { createdAt: -1 }; // Default 
        }

        const products = await productSchema
            .find(baseQuery)
            .populate('category', 'name')
            .sort(sortOptions);

        if (req.xhr) {
            return res.render('user/searchResults', {
                products,
                query,
                layout: false
            });
        }


        res.render('user/searchResults', {
            products,
            query,
            fullname: req.session.user?.fullname
        });

    } catch (error) {
        log.red("ERROR", error);
        res.status(500).render('notfound', {
            message: "Error searching products",
            alertType: "error"
        });
    }
};

export default {
    searchProducts
};