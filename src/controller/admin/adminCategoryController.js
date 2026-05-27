import { categoryModel } from "../../model/categoryModel.js";
import { productModel } from "../../model/productModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";
import { validateCategory } from "../../validators/category.validator.js";
import { AdminCategoryErrorMessages } from "../../constants/errorMessages.js";
import { CategorySuccessMessages } from "../../constants/successMessage.js";
import { ADMIN_VIEW_PATHS } from "../../constants/viewPaths.js";

//---- Fetch the categories page----
const getCategories = asyncHandler(async (req, res) => {
  const { message, alertType } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const search = req.query.search || "";

  // search query
  const searchQuery = {
    name: { $regex: search, $options: "i" },
  };

  const totalCategories = await categoryModel.countDocuments(searchQuery);
  const totalPages = Math.ceil(totalCategories / limit);
  const skip = (page - 1) * limit;

  const categories = await categoryModel
    .find(searchQuery)
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  res.render(ADMIN_VIEW_PATHS.Categories, {
    categories,
    message,
    page: "categories",
    alertType,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    search,
  });
});

//---- Delete a category----
const deleteCategory = asyncHandler(async (req, res) => {
  await categoryModel.findByIdAndDelete(req.params.categoryid);
  res.json({
    success: true,
    message: CategorySuccessMessages.Deleted,
  });
});

//---- Hide a category----
const hideCategory = asyncHandler(async (req, res) => {
  await categoryModel.findByIdAndUpdate(req.params.categoryid, {
    status: "Inactive",
  });

  // Update all products in this category to Inactive
  await productModel.updateMany(
    { category: req.params.categoryid },
    { status: "Inactive" },
  );

  res.json({
    success: true,
    message: CategorySuccessMessages.Disabled,
  });
});

//---- Unhide a category----
const unhideCategory = asyncHandler(async (req, res) => {
  await categoryModel.findByIdAndUpdate(req.params.categoryid, {
    status: "Active",
  });

  // Update all products in this category to Active
  await productModel.updateMany(
    { category: req.params.categoryid },
    { status: "Active" },
  );

  res.json({
    success: true,
    message: CategorySuccessMessages.Enabled,
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
    throw new AppError(
      HttpStatus.CONFLICT,
      AdminCategoryErrorMessages.Conflict,
    );
  }

  let newCategory = new categoryModel({
    name,
    description,
    status: "Active",
  });

  const savedCategory = await newCategory.save();
  res.json({
    success: true,
    message: CategorySuccessMessages.Created,
    category: savedCategory,
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
    _id: { $ne: req.params.categoryid },
  });

  if (existingCategory) {
    throw new AppError(
      HttpStatus.CONFLICT,
      AdminCategoryErrorMessages.Conflict,
    );
  }

  const updatedCategory = await categoryModel.findByIdAndUpdate(
    req.params.categoryid,
    { name, description },
    { new: true },
  );

  if (!updatedCategory) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminCategoryErrorMessages.Notfound,
    );
  }

  res.json({
    success: true,
    message: CategorySuccessMessages.Updated,
    category: updatedCategory,
  });
});

export default {
  getCategories,
  deleteCategory,
  hideCategory,
  unhideCategory,
  addCategory,
  editCategory,
};
