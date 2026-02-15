import { log } from "mercedlogger";
import categorySchema from "../../model/categoryModel.js";
import productSchema from "../../model/productModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";

//---- Fetch the categories page----
const getCategories = asyncHandler(async (req, res) => {
  const { message, alertType } = req.query
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const search = req.query.search || '';

  // search query
  const searchQuery = {
    name: { $regex: search, $options: 'i' }
  };

  const totalCategories = await categorySchema.countDocuments(searchQuery);
  const totalPages = Math.ceil(totalCategories / limit);
  const skip = (page - 1) * limit;

  const categories = await categorySchema.find(searchQuery)
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

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
});

//---- Delete a category----
const deleteCategory = asyncHandler(async (req, res) => {
  await categorySchema.findByIdAndDelete(req.params.categoryid);
  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

//---- Hide a category----
const hideCategory = asyncHandler(async (req, res) => {
  await categorySchema.findByIdAndUpdate(req.params.categoryid, { status: "Inactive" });

  // Update all products in this category to Inactive
  await productSchema.updateMany(
    { category: req.params.categoryid },
    { status: "Inactive" }
  );

  res.json({
    success: true,
    message: 'Category and associated products hidden successfully'
  });
});

//---- Unhide a category----
const unhideCategory = asyncHandler(async (req, res) => {
  await categorySchema.findByIdAndUpdate(req.params.categoryid, { status: "Active" });

  // Update all products in this category to Active
  await productSchema.updateMany(
    { category: req.params.categoryid },
    { status: "Active" }
  );

  res.json({
    success: true,
    message: 'Category and associated products unhidden successfully'
  });
});

//---- Add a new category----
const addCategory = asyncHandler(async (req, res) => {
  let { name, description } = req.body;
  name = name.trim()[0].toUpperCase() + name.trim().slice(1).toLowerCase();
  description = description.trim();

  if (!name || !description) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Category name and description are required');
  }
  if (name.length < 3 || name.length > 100) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Category name must be between 3-100 characters');
  }

  if (description.length < 10 || description.length > 100) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Description  must be between 10-100 characters');
  }

  const existingCategory = await categorySchema.findOne({ name });
  if (existingCategory) {
    throw new AppError(HttpStatus.CONFLICT, 'Category with same name already exists');
  }

  let newCategory = new categorySchema({
    name,
    description,
    status: "Active"
  });

  const savedCategory = await newCategory.save();
  res.json({
    success: true,
    message: 'Category created successfully',
    category: savedCategory
  });
});

//---- Edit a category----
const editCategory = asyncHandler(async (req, res) => {
  let { name, description } = req.body;

  name = name.trim()[0].toUpperCase() + name.trim().slice(1).toLowerCase();
  description = description.trim();


  if (!name || !description) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Category name and description are required');
  }
  if (name.length < 3 || name.length > 100) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Category name must be between 3-100 characters');
  }

  if (description.length < 10 || description.length > 500) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Description  must be between 3-100 characters');
  }

  // find if another category exists with name
  const existingCategory = await categorySchema.findOne({
    name: name,
    _id: { $ne: req.params.categoryid }
  });

  if (existingCategory) {
    throw new AppError(HttpStatus.CONFLICT, 'Category name already exists');
  }

  const updatedCategory = await categorySchema.findByIdAndUpdate(
    req.params.categoryid,
    { name, description },
    { new: true }
  );

  if (!updatedCategory) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Category not found');
  }

  res.json({
    success: true,
    message: 'Category updated successfully',
    category: updatedCategory
  });
});

export default {
  getCategories,
  deleteCategory,
  hideCategory,
  unhideCategory,
  addCategory,
  editCategory
};
