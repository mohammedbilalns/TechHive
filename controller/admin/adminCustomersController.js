import { log } from "mercedlogger"
import userSchema from "../../model/userModel.js"

const getCustomers = async (req, res) => {
  try {
    let message = req.query.message
    let alertType = req.query.alertType
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''

    const searchQuery = {
      $or: [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const totalCustomers = await userSchema.countDocuments(searchQuery)
    const totalPages = Math.ceil(totalCustomers / limit)

    const customers = await userSchema.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

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
    })

  } catch (error) {
    log.red('FETCH_USERS_ERROR', error)
    res.status(500).send("Error fetching customers")
  }
}


const blockCustomer = async (req, res) => {
  try {
    const customer = await userSchema.findByIdAndUpdate(
      req.params.customerid,
      { status: "Blocked" },
      { new: true }
    );
    // delete the user's session if it is active 
    if (req.session.user?.id == customer._id) {
      delete req.session.user
    }
    res.status(200).json({
      success: true,
      message: 'Customer blocked successfully',
      customer
    });
  } catch (error) {
    log.red('BLOCK_CUSTOMER_ERROR', error)
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
}

const unblockCustomer = async (req, res) => {
  try {
    const customer = await userSchema.findByIdAndUpdate(
      req.params.customerid,
      { status: "Active" },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: 'Customer unblocked successfully',
      customer
    });
  } catch (error) {
    log.red('UNBLOCK_CUSTOMER_ERROR', error)
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
}



export default {
  getCustomers, blockCustomer, unblockCustomer
}