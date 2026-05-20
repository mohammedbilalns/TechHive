import { categoryModel } from "../../model/categoryModel.js";
import { productModel } from "../../model/productModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";
import { validateCategory } from "../../validators/category.validator.js";

//---- Fetch the categories page----
const getCategories = asyncHandler(async (req, res) => {
  const { message, alertType } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const search = req.query.search || '';

  // search query
  const searchQuery = {
    name: { $regex: search, $options: 'i' }
  };

  const totalCategories = await categoryModel.countDocuments(searchQuery);
  const totalPages = Math.ceil(totalCategories / limit);
  const skip = (page - 1) * limit;

  const categories = await categoryModel.find(searchQuery)
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
  await categoryModel.findByIdAndDelete(req.params.categoryid);
  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

//---- Hide a category----
const hideCategory = asyncHandler(async (req, res) => {
  await categoryModel.findByIdAndUpdate(req.params.categoryid, { status: "Inactive" });

  // Update all products in this category to Inactive
  await productModel.updateMany(
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
  await categoryModel.findByIdAndUpdate(req.params.categoryid, { status: "Active" });

  // Update all products in this category to Active
  await productModel.updateMany(
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
  const { error, value } = validateCategory(req.body);

  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const { name, description } = value;

  const existingCategory = await categoryModel.findOne({ name });
  if (existingCategory) {
    throw new AppError(HttpStatus.CONFLICT, 'Category with same name already exists');
  }

  let newCategory = new categoryModel({
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
  const { error, value } = validateCategory(req.body);

  if (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, error);
  }

  const { name, description } = value;

  // find if another category exists with name
  const existingCategory = await categoryModel.findOne({
    name: name,
    _id: { $ne: req.params.categoryid }
  });

  if (existingCategory) {
    throw new AppError(HttpStatus.CONFLICT, 'Category name already exists');
  }

  const updatedCategory = await categoryModel.findByIdAndUpdate(
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
