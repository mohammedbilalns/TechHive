import { log } from "mercedlogger";
import userSchema from "../../model/userModel.js";
import { HttpStatus } from "../../constants/statusCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";

const getCustomers = asyncHandler(async (req, res) => {
  let message = req.query.message;
  let alertType = req.query.alertType;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const searchQuery = {
    $or: [
      { fullname: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  };

  const totalCustomers = await userSchema.countDocuments(searchQuery);
  const totalPages = Math.ceil(totalCustomers / limit);

  const customers = await userSchema.find(searchQuery)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.render('admin/customers', {
    customers,
    message,
    alertType,
    page: 'customers',
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    search
  });
});


const blockCustomer = asyncHandler(async (req, res) => {
  const customer = await userSchema.findByIdAndUpdate(
    req.params.customerid,
    { status: "Blocked" },
    { new: true }
  );

  if (!customer) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Customer not found');
  }

  // delete the user's session if it is active 
  if (req.session.user?.id == customer._id) {
    delete req.session.user;
  }
  res.status(HttpStatus.OK).json({
    success: true,
    message: 'Customer blocked successfully',
    customer
  });
});

const unblockCustomer = asyncHandler(async (req, res) => {
  const customer = await userSchema.findByIdAndUpdate(
    req.params.customerid,
    { status: "Active" },
    { new: true }
  );

  if (!customer) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Customer not found');
  }

  res.status(HttpStatus.OK).json({
    success: true,
    message: 'Customer unblocked successfully',
    customer
  });
});



export default {
  getCustomers, blockCustomer, unblockCustomer
};
