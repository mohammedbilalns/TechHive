import express from "express"
import { Router } from "express"
import adminController from "../controller/adminController.js"
import adminAuth from "../middlewares/adminAuth.js"

const router = Router()

router.use(express.static('static'))


//---- login routes ----
router.get('/login', adminAuth.isLogin, adminController.loadLogin)
router.post('/login', adminAuth.isLogin, adminController.verifyLogin )


//---- customers routes ----
router.get('/customers',adminAuth.checkSession,  adminController.getCustomers) // add middleware to check session in this 

router.post('/customers/block/:customerid',adminAuth.checkSession ,adminController.blockCustomer)
router.post('/customers/unblock/:customerid',adminAuth.checkSession ,adminController.unblockCustomer)


//---- categories routes ----
router.get('/categories', adminController.getCategories)
router.post('/categories/delete/:categoryid', adminController.deleteCategory)
router.post('/categories/hide/:categoryid', adminController.hideCategory)
router.post('/categories/unhide/:categoryid', adminController.unhideCategory)
router.post('/categories/new', adminController.addCategory)
router.post('/categories/edit/:categoryid', adminController.editCategory)


const products = [
    {
      id: 1,
      name: 'Wireless Mouse',
      category: 'Electronics',
      price: 29.99,
      stock: 120,
      addedDate: '2024-01-15',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Leather Wallet',
      category: 'Accessories',
      price: 19.99,
      stock: 75,
      addedDate: '2024-02-20',
      status: 'Active',
    },
    {
      id: 3,
      name: 'Bluetooth Speaker',
      category: 'Electronics',
      price: 49.99,
      stock: 60,
      addedDate: '2024-03-05',
      status: 'Inactive',
    },
    {
      id: 4,
      name: 'Running Shoes',
      category: 'Footwear',
      price: 69.99,
      stock: 40,
      addedDate: '2024-04-10',
      status: 'Active',
    },
  ];
  
  // Route to render the products dashboard
  router.get('/products-dashboard', (req, res) => {
    res.render('admin/products', { products });
  });

export default router