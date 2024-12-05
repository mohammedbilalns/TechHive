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
      addedDate: '2024-01-15',
      status: 'Active',
      variants: [
        { variantName: 'Black', price: 29.99, stock: 50, image: '/images/mouse-black.jpg' },
        { variantName: 'White', price: 31.99, stock: 70, image: '/images/mouse-white.jpg' },
      ],
    },
    {
      id: 2,
      name: 'Leather Wallet',
      category: 'Accessories',
      addedDate: '2024-02-20',
      status: 'Active',
      variants: [
        { variantName: 'Brown', price: 19.99, stock: 45, image: '/images/wallet-brown.jpg' },
        { variantName: 'Black', price: 21.99, stock: 30, image: '/images/wallet-black.jpg' },
      ],
    },
    {
      id: 3,
      name: 'Bluetooth Speaker',
      category: 'Electronics',
      addedDate: '2024-03-05',
      status: 'Inactive',
      variants: [
        { variantName: 'Red', price: 49.99, stock: 30, image: '/images/speaker-red.jpg' },
        { variantName: 'Blue', price: 51.99, stock: 30, image: '/images/speaker-blue.jpg' },
      ],
    },
    {
      id: 4,
      name: 'Running Shoes',
      category: 'Footwear',
      addedDate: '2024-04-10',
      status: 'Active',
      variants: [
        { variantName: 'Size 8', price: 69.99, stock: 20, image: '/images/shoes-size8.jpg' },
        { variantName: 'Size 10', price: 74.99, stock: 20, image: '/images/shoes-size10.jpg' },
      ],
    },
  ];
  
  // Route to render the products dashboard
  router.get('/products-dashboard', (req, res) => {
    res.render('admin/products', { products });
  });
  
export default router