import {log} from "mercedlogger"
import userSchema from "../../model/userModel.js"

const getCustomers = async (req,res)=>{
    try{
        let message = req.query.message 
        let alertType = req.query.alertType
        const customers = await userSchema.find()
        res.render('admin/userdashboard', {customers, message, alertType, page: 'customers'})

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