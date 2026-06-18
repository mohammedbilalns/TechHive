import { categoryModel } from "../../model/categoryModel.js";
import { productModel } from "../../model/productModel.js";
import multer from "multer";
import mongoose from "mongoose";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";
import { validateProduct } from "../../validators/product.validator.js";
import { AdminProductErrorMessages } from "../../constants/errorMessages.js";
import { AdminProductSuccessMessages } from "../../constants/successMessage.js";
import { ADMIN_VIEW_PATHS } from "../../constants/viewPaths.js";
import {
  createCloudinaryImageRecord,
  deleteCloudinaryImage,
  uploadBufferToCloudinary,
} from "../../utils/cloudinary.js";
import {
  getPageNumber,
  getPaginationMeta,
} from "../../utils/controllerHelpers.js";
import logger from "../../utils/logger.js";

const productStorage = multer.memoryStorage();

const buildFileDebugInfo = (files = []) =>
  files.map((file, index) => ({
    index,
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  }));

const getRequestDebugInfo = (req) => ({
  requestId: req.requestId || req.res?.locals?.requestId || null,
  method: req.method,
  url: req.originalUrl,
  userId: req.session?.user?._id?.toString?.() || null,
});

export const productUpload = multer({
  storage: productStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload an image."), false);
    }
  },
});

export const renderProductManagementPage = asyncHandler(async (req, res) => {
  let message = req.query.message;
  let alertType = req.query.alertType;
  const page = getPageNumber(req.query.page);
  const limit = 10;
  const search = req.query.search || "";

  // Create search query
  const searchQuery = {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ],
  };

  const skip = (page - 1) * limit;
  const [totalProducts, products] = await Promise.all([
    productModel.countDocuments(searchQuery),
    productModel
      .find(searchQuery)
      .populate("category")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);
  const { totalPages, hasNextPage, hasPrevPage } = getPaginationMeta(
    page,
    totalProducts,
    limit,
  );

  res.render(ADMIN_VIEW_PATHS.Products, {
    products,
    page: "products",
    message,
    alertType,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    search,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  // Get the product details
  const product = await productModel.findById(req.params.productid).lean();

  if (!product) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminProductErrorMessages.PRODUCT_NOT_FOUND,
    );
  }

  if (product.images && product.images.length > 0) {
    await Promise.allSettled(
      product.images.map((image) => deleteCloudinaryImage(image.filename)),
    );
  }

  // Delete the product from database
  await productModel.findByIdAndDelete(req.params.productid);

  res.json({
    success: true,
    message: AdminProductSuccessMessages.DELETED,
  });
});

export const deactivateProduct = asyncHandler(async (req, res) => {
  const product = await productModel.findByIdAndUpdate(
    req.params.productid,
    { status: "Inactive" },
    { new: true },
  ).lean();

  if (!product) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminProductErrorMessages.PRODUCT_NOT_FOUND,
    );
  }

  res.json({
    success: true,
    message: AdminProductSuccessMessages.DEACTIVATED,
    product,
  });
});

export const activateProduct = asyncHandler(async (req, res) => {
  const product = await productModel.findByIdAndUpdate(
    req.params.productid,
    { status: "Active" },
    { new: true },
  ).lean();

  if (!product) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminProductErrorMessages.PRODUCT_NOT_FOUND,
    );
  }

  res.json({
    success: true,
    message: AdminProductSuccessMessages.ACTIVATED,
    product,
  });
});

export const renderAddProductPage = asyncHandler(async (_req, res) => {
  const categories = await categoryModel.find({ status: "Active" }).lean();
  res.render(ADMIN_VIEW_PATHS.AddProduct, { categories, page: "products" });
});

export const addProduct = asyncHandler(async (req, res) => {
  const requestInfo = getRequestDebugInfo(req);
  const fileDebugInfo = buildFileDebugInfo(req.files || []);

  logger.info("ADMIN_PRODUCT_ADD_REQUEST", {
    ...requestInfo,
    bodyKeys: Object.keys(req.body || {}),
    fileCount: fileDebugInfo.length,
    files: fileDebugInfo,
  });

  try {
    let { name, description, price, stock, brand, category, specifications } =
      req.body;

    logger.debug("ADMIN_PRODUCT_ADD_RAW_PAYLOAD", {
      ...requestInfo,
      hasName: Boolean(name),
      hasDescription: Boolean(description),
      hasPrice: Boolean(price),
      hasStock: Boolean(stock),
      hasBrand: Boolean(brand),
      hasCategory: Boolean(category),
      specificationCount: Array.isArray(specifications)
        ? specifications.length
        : specifications
          ? 1
          : 0,
    });

    if (!req.files || req.files.length === 0) {
      logger.warn("ADMIN_PRODUCT_ADD_MISSING_IMAGES", {
        ...requestInfo,
        fileCount: 0,
      });
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "At least one product image is required",
      );
    }

    // Sanitization
    name = name
      .trim()
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    description = description.trim();
    brand = brand
      .trim()
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    const specArray = Array.isArray(specifications)
      ? specifications
      : [specifications];
    const cleanedSpecs = specArray
      .filter((spec) => spec && spec.trim())
      .map((spec) => spec.trim());

    logger.debug("ADMIN_PRODUCT_ADD_SANITIZED_PAYLOAD", {
      ...requestInfo,
      name,
      brand,
      category,
      price,
      stock,
      cleanedSpecCount: cleanedSpecs.length,
    });

    // Validation
    const validationError = validateProduct({
      name,
      description,
      price,
      stock,
      brand,
      category,
    });
    if (validationError) {
      logger.warn("ADMIN_PRODUCT_ADD_VALIDATION_FAILED", {
        ...requestInfo,
        validationError,
      });
      throw new AppError(HttpStatus.BAD_REQUEST, validationError);
    }

    logger.debug("ADMIN_PRODUCT_ADD_DUPLICATE_CHECK", {
      ...requestInfo,
      name,
    });

    const product = await productModel.findOne({ name });
    if (product) {
      logger.warn("ADMIN_PRODUCT_ADD_DUPLICATE_PRODUCT", {
        ...requestInfo,
        productId: product._id.toString(),
        name,
      });
      throw new AppError(
        HttpStatus.CONFLICT,
        AdminProductErrorMessages.PRODUCT_EXISTS,
      );
    }

    logger.info("ADMIN_PRODUCT_ADD_IMAGE_UPLOAD_START", {
      ...requestInfo,
      fileCount: req.files.length,
    });

    const uploadedImages = await Promise.all(
      req.files.map(async (file, index) => {
        logger.debug("ADMIN_PRODUCT_ADD_IMAGE_UPLOAD_BEGIN", {
          ...requestInfo,
          index,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });

        try {
          const uploadResult = await uploadBufferToCloudinary(file.buffer);

          logger.debug("ADMIN_PRODUCT_ADD_IMAGE_UPLOAD_SUCCESS", {
            ...requestInfo,
            index,
            publicId: uploadResult.public_id,
            bytes: uploadResult.bytes,
            format: uploadResult.format,
          });

          return createCloudinaryImageRecord(uploadResult);
        } catch (error) {
          logger.error("ADMIN_PRODUCT_ADD_IMAGE_UPLOAD_FAILED", {
            ...requestInfo,
            index,
            originalname: file.originalname,
            message: error.message,
            stack: error.stack,
          });
          throw error;
        }
      }),
    );

    logger.info("ADMIN_PRODUCT_ADD_IMAGE_UPLOAD_COMPLETE", {
      ...requestInfo,
      uploadedCount: uploadedImages.length,
    });

    const newProduct = new productModel({
      name,
      description,
      brand,
      category,
      specifications: cleanedSpecs,
      price: parseFloat(price),
      stock: parseInt(stock),
      images: uploadedImages,
      status: "Active",
    });

    logger.debug("ADMIN_PRODUCT_ADD_DB_SAVE_START", {
      ...requestInfo,
      name: newProduct.name,
      imageCount: newProduct.images.length,
    });

    await newProduct.save();

    logger.info("ADMIN_PRODUCT_ADD_SUCCESS", {
      ...requestInfo,
      productId: newProduct._id.toString(),
      name: newProduct.name,
      imageCount: newProduct.images.length,
    });

    res.json({
      success: true,
      message: AdminProductSuccessMessages.ADDED,
    });
  } catch (error) {
    logger.error("ADMIN_PRODUCT_ADD_FAILED", {
      ...requestInfo,
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw error;
  }
});

export const renderUpdateProductPage = asyncHandler(async (req, res) => {
  const productId = req.params.productid;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.redirect(
      `/notfound?message=${encodeURIComponent(AdminProductErrorMessages.INVALID_PRODUCT_ID)}&alertType=error`,
    );
    return;
  }

  const [product, categories] = await Promise.all([
    productModel.findById(productId).lean(),
    categoryModel.find({ status: "Active" }).lean(),
  ]);


  // Check if product exists
  if (!product) {
    res.redirect(
      `/notfound?message=${encodeURIComponent(AdminProductErrorMessages.PRODUCT_NOT_FOUND)}&alertType=error`,
    );
    return;
  }

  res.render(ADMIN_VIEW_PATHS.EditProduct, {
    product,
    categories,
    page: "products",
  });
});

export const editProduct = asyncHandler(async (req, res) => {
  const productId = req.params.productid;
  if (!productId) {
    res.redirect(
      `/notfound?message=${encodeURIComponent(AdminProductErrorMessages.INVALID_PRODUCT_ID)}&alertType=error`,
    );
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.redirect(
      `/notfound?message=${encodeURIComponent(AdminProductErrorMessages.INVALID_PRODUCT_ID)}&alertType=error`,
    );
    return;
  }

  let { name, description, price, stock, brand, category, specifications } =
    req.body;

  // Sanitization
  name = name
    .trim()
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  description = description.trim();
  brand = brand
    .trim()
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  const specArray = Array.isArray(specifications)
    ? specifications
    : [specifications];
  const cleanedSpecs = specArray
  .filter((spec) => spec && spec.trim())
  .map((spec) => spec.trim());

  // Validation
  const validationError = validateProduct({
    name,
    description,
    price,
    stock,
    brand,
    category,
  });
  if (validationError) {
    throw new AppError(HttpStatus.BAD_REQUEST, validationError);
  }

  const [existingproduct, product] = await Promise.all([
    productModel.findOne({
      name,
      _id: { $ne: productId },
    }).lean(),
    productModel.findById(productId).lean(),
  ]);
  if (existingproduct) {
    throw new AppError(
      HttpStatus.CONFLICT,
      AdminProductErrorMessages.PRODUCT_EXISTS,
    );
  }

  if (!product) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminProductErrorMessages.PRODUCT_NOT_FOUND,
    );
  }

  // Handle image updates
  let images = [...product.images];
  const oldImagesToDelete = [];

  if (req.files && req.files.length > 0) {
    const newImages = await Promise.all(
      req.files.map(async (file) => {
        const uploadResult = await uploadBufferToCloudinary(file.buffer);
        return createCloudinaryImageRecord(uploadResult);
      }),
    );

    newImages.forEach((newImage, index) => {
      if (images[index]) {
        oldImagesToDelete.push(images[index]);
        images[index] = newImage;
      } else {
        images.push(newImage);
      }
    });
  }

  // Update product with new data
  const updatedProduct = await productModel.findByIdAndUpdate(
    productId,
    {
      name,
      description,
      brand,
      category,
      specifications: cleanedSpecs,
      price: parseFloat(price),
      stock: parseInt(stock),
      images,
    },
    { new: true },
  );

  if (!updatedProduct) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminProductErrorMessages.FAILED_TO_UPDATE_PRODUCT,
    );
  }

  if (oldImagesToDelete.length > 0) {
    await Promise.allSettled(
      oldImagesToDelete.map((image) => deleteCloudinaryImage(image.filename)),
    );
  }

  res.json({
    success: true,
    message: AdminProductSuccessMessages.UPDATED,
  });
});
