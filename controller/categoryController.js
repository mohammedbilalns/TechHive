
import { log } from "mercedlogger";
import categorySchema from "../model/categoryModel.js"


const getCategories = async (req, res)=>{
    try{
        let message = req.query.message 
        let alertType = req.query.alertType

        const categories = await categorySchema.find()
        res.render('admin/categories', {categories, message, alertType})
    }catch(error){
        log.red('FETCH_CATEGORIES_ERROR',error)
    }
}

const deleteCategory = async (req,res) => {
    try {
        await categorySchema.findByIdAndDelete(req.params.categoryid)
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch(error) {
        log.red('DELETE_CATEGORY_ERROR', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
}

const hideCategory = async (req,res) => {
    try {
        await categorySchema.findByIdAndUpdate(req.params.categoryid, {status:"Inactive"})
        res.json({
            success: true,
            message: 'Category hidden successfully'
        });
    } catch(error) {
        log.red('HIDE_CATEGORY_ERROR', error)
        res.status(500).json({
            success: false,
            message: 'Failed to hide category'
        });
    }
}

const unhideCategory = async (req,res) => {
    try {
        await categorySchema.findByIdAndUpdate(req.params.categoryid, {status:"Active"})
        res.json({
            success: true,
            message: 'Category unhidden successfully'
        });
    } catch(error) {
        log.red('HIDE_CATEGORY_ERROR', error)
        res.status(500).json({
            success: false,
            message: 'Failed to unhide category'
        });
    }
}


const addCategory = async (req,res) => {
    try {
        let {name, description} = req.body 
        name = name.trim()[0].toUpperCase() + name.trim().slice(1).toLowerCase()
        description = description.trim()

        const existingCategory = await categorySchema.findOne({name})
        if(existingCategory) {
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
    } catch(error) {
        log.red('ADD_CATEGORY_ERROR', error)
        res.status(500).json({
            success: false,
            message: 'Failed to create category'
        });
    }
}


const editCategory = async (req, res) => {
    try {
        let { name, description } = req.body;

        name = name.trim()[0].toUpperCase() + name.trim().slice(1).toLowerCase();
        description = description.trim();
        
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