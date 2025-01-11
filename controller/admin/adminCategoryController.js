import { log } from "mercedlogger";
import categorySchema from "../../model/categoryModel.js"
import productSchema from "../../model/productModel.js"

//---- Fetch the categories page----
const getCategories = async (req, res) => {
    try {
        let message = req.query.message
        let alertType = req.query.alertType
        const page = parseInt(req.query.page) || 1
        const limit = 10
        const search = req.query.search || ''

        // search query
        const searchQuery = {
            name: { $regex: search, $options: 'i' }
        }

        const totalCategories = await categorySchema.countDocuments(searchQuery)
        const totalPages = Math.ceil(totalCategories / limit)
        const skip = (page - 1) * limit

        const categories = await categorySchema.find(searchQuery)
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)

        res.render('admin/categories', {
            categories,
            message,
            page: 'categories',
            alertType,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            search
        });
    } catch (error) {
        log.red('FETCH_CATEGORIES_ERROR', error)
        res.status(500).send("Error fetching categories")
    }
}

//---- Delete a category----
const deleteCategory = async (req, res) => {
    try {
        await categorySchema.findByIdAndDelete(req.params.categoryid)
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        log.red('DELETE_CATEGORY_ERROR', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
}

//---- Hide a category----
const hideCategory = async (req, res) => {
    try {
        await categorySchema.findByIdAndUpdate(req.params.categoryid, { status: "Inactive" })

        // Update all products in this category to Inactive
        await productSchema.updateMany(
            { category: req.params.categoryid },
            { status: "Inactive" }
        );

        res.json({
            success: true,
            message: 'Category and associated products hidden successfully'
        });
    } catch (error) {
        log.red('HIDE_CATEGORY_ERROR', error)
        res.status(500).json({
            success: false,
            message: 'Failed to hide category'
        });
    }
}

//---- Unhide a category----
const unhideCategory = async (req, res) => {
    try {
        await categorySchema.findByIdAndUpdate(req.params.categoryid, { status: "Active" })

        // Update all products in this category to Active
        await productSchema.updateMany(
            { category: req.params.categoryid },
            { status: "Active" }
        );

        res.json({
            success: true,
            message: 'Category and associated products unhidden successfully'
        });
    } catch (error) {
        log.red('HIDE_CATEGORY_ERROR', error)
        res.status(500).json({
            success: false,
            message: 'Failed to unhide category'
        });
    }
}
//---- Add a new category----
const addCategory = async (req, res) => {
    try {
        let { name, description } = req.body
        name = name.trim()[0].toUpperCase() + name.trim().slice(1).toLowerCase()
        description = description.trim()

        if(!name || !description){
            return res.status(400).json({
                success: false,
                message: 'Category name and description are required'
            });
        }
        if( name.length<3 || name.length >100){
            return res.status(400).json({
                success: false,
                message: 'Category name must be between 3-100 characters'
            });
        }

        if(description.length< 10 || description.length>500){
            return res.status(400).json({
                success: false,
                message: 'Description  must be between 3-100 characters'
            });
        }

        const existingCategory = await categorySchema.findOne({ name })
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with same name already exists'
            });
        }

        let newCategory = new categorySchema({
            name,
            description,
            status: "Active"
        })

        const savedCategory = await newCategory.save()
        res.json({
            success: true,
            message: 'Category created successfully',
            category: savedCategory
        });
    } catch (error) {
        log.red('ADD_CATEGORY_ERROR', error)
        res.status(500).json({
            success: false,
            message: 'Failed to create category'
        });
    }
}

//---- Edit a category----
const editCategory = async (req, res) => {
    try {
        let { name, description } = req.body;

        name = name.trim()[0].toUpperCase() + name.trim().slice(1).toLowerCase();
        description = description.trim();


        if(!name || !description){
            return res.status(400).json({
                success: false,
                message: 'Category name and description are required'
            });
        }
        if( name.length<3 || name.length >100){
            return res.status(400).json({
                success: false,
                message: 'Category name must be between 3-100 characters'
            });
        }

        if(description.length< 10 || description.length>500){
            return res.status(400).json({
                success: false,
                message: 'Description  must be between 3-100 characters'
            });
        }

        // find if another category exists with name
        const existingCategory = await categorySchema.findOne({
            name: name,
            _id: { $ne: req.params.categoryid }
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists'
            });
        }

        const updatedCategory = await categorySchema.findByIdAndUpdate(
            req.params.categoryid,
            { name, description },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Category updated successfully',
            category: updatedCategory
        });
    } catch (error) {
        log.red("EDIT_CATEGORY_ERROR", error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category'
        });
    }
};

export default {
    getCategories,
    deleteCategory,
    hideCategory,
    unhideCategory,
    addCategory,
    editCategory
}
