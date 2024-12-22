import {log} from "mercedlogger"
import userSchema from "../../model/userModel.js"

const getCustomers = async (req,res)=>{
    try{
        let message = req.query.message 
        let alertType = req.query.alertType
        
        // Add pagination
        const page = parseInt(req.query.page) || 1
        const limit = 10
        const skip = (page - 1) * limit
        
        const totalCustomers = await userSchema.countDocuments()
        const totalPages = Math.ceil(totalCustomers / limit)
        
        const customers = await userSchema.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        res.render('admin/userdashboard', {
            customers, 
            message, 
            alertType, 
            page: 'customers',
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        })

    }catch(error){
        log.red('FETCH_USERS_ERROR',error)
    }
}


const blockCustomer = async (req,res)=>{
   try{
    const customer = await userSchema.findByIdAndUpdate(
      req.params.customerid, 
      {status:"Blocked"},
      {new: true}
    );
    if(req.session.user?.id == customer._id ){
      delete req.session.user
    }
    res.json({
      success: true,
      message: 'Customer blocked successfully',
      customer
    });
   }catch(error){
    log.red('BLOCK_CUSTOMER_ERROR', error)
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
   }
}

const unblockCustomer = async (req, res)=>{
    try{
        const customer = await userSchema.findByIdAndUpdate(
          req.params.customerid, 
          {status:"Active"},
          {new: true}
        );
        res.json({
          success: true,
          message: 'Customer unblocked successfully',
          customer
        });
    }catch(error){
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