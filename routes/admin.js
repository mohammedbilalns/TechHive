import express from "express"
import { Router } from "express"
import adminController from "../controller/adminController.js"
import adminAuth from "../middlewares/adminAuth.js"

const router = Router()

router.use(express.static('static'))


//--login routes ---
router.get('/login', adminAuth.isLogin, adminController.loadLogin)
router.post('/login', adminAuth.isLogin, adminController.verifyLogin )


//-- customers routes----
router.get('/customers',adminAuth.checkSession,  adminController.getCustomers) // add middleware to check session in this 

router.post('/customers/block/:customerid',adminAuth.checkSession ,adminController.blockCustomer)
router.post('/customers/unblock/:customerid',adminAuth.checkSession ,adminController.unblockCustomer)


const categories = [
    { id: 1, name: 'Electronics', status: 'Active' },
    { id: 2, name: 'Fashion', status: 'Inactive' },
    { id: 3, name: 'Groceries', status: 'Active' },
    { id: 4, name: 'Furniture', status: 'Inactive' },
  ];

router.get('/categories', (req, res) => {
    res.render('admin/categories', { categories });
  });
  
export default router