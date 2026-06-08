import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { UserModel } from "../../model/userModel.js";
import { AppError } from "../../utils/appError.js";
import { AdminCustomerErrorMessages } from "../../constants/errorMessages.js";
import { AdminCustomerSuccessMessages } from "../../constants/successMessage.js";
import { ADMIN_VIEW_PATHS } from "../../constants/viewPaths.js";
import {
  getPageNumber,
  getPaginationMeta,
} from "../../utils/controllerHelpers.js";

export const renderCustomersPage = asyncHandler(async (req, res) => {
  let message = req.query.message;
  let alertType = req.query.alertType;
  const page = getPageNumber(req.query.page);
  const limit = 10;
  const search = req.query.search || "";

  const searchQuery = {
    $or: [
      { fullname: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
  };

  const skip = (page - 1) * limit;
  const [totalCustomers, customers] = await Promise.all([
    UserModel.countDocuments(searchQuery),
    UserModel.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const { totalPages, hasNextPage, hasPrevPage } = getPaginationMeta(
    page,
    totalCustomers,
    limit,
  );

  res.render(ADMIN_VIEW_PATHS.Customers, {
    customers,
    message,
    alertType,
    page: "customers",
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    search,
  });
});

export const blockCustomer = asyncHandler(async (req, res) => {
  const customer = await UserModel.findByIdAndUpdate(
    req.params.customerid,
    { status: "Blocked" },
    { new: true },
  );

  if (!customer) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminCustomerErrorMessages.Notfound,
    );
  }

  // delete the user's session if it is active
  if (req.session.user?.id == customer._id) {
    delete req.session.user;
  }
  res.status(HttpStatus.OK).json({
    success: true,
    message: AdminCustomerSuccessMessages.Blocked,
    customer,
  });
});

export const unblockCustomer = asyncHandler(async (req, res) => {
  const customer = await UserModel.findByIdAndUpdate(
    req.params.customerid,
    { status: "Active" },
    { new: true },
  );

  if (!customer) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      AdminCustomerErrorMessages.Notfound,
    );
  }

  res.status(HttpStatus.OK).json({
    success: true,
    message: AdminCustomerSuccessMessages.Unblocked,
    customer,
  });
});
