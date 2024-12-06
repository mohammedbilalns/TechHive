import express from "express"
import { Router } from "express"
import adminController from "../controller/adminController.js"
import adminAuth from "../middlewares/adminAuth.js"
import multer from "multer"
import path from "path"

const router = Router()

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the filename
    }
})

// Initialize upload variable
const upload = multer({ storage: storage })

router.use(express.static('static'))


//---- login routes ----
router.get('/login', adminAuth.isLogin, adminController.loadLogin)
router.post('/login', adminAuth.isLogin, adminController.verifyLogin )
router.get('/logout',adminController.logoutAdmin)

//---- customers routes ----
router.get('/customers',adminAuth.checkSession,  adminController.getCustomers) // add middleware to check session in this 

router.post('/customers/block/:customerid',adminAuth.checkSession ,adminController.blockCustomer)
router.post('/customers/unblock/:customerid',adminAuth.checkSession ,adminController.unblockCustomer)


//---- categories routes ----
router.get('/categories', adminController.getCategories) // add middleware in this 
router.post('/categories/delete/:categoryid',adminAuth.checkSession,  adminController.deleteCategory)
router.post('/categories/hide/:categoryid',adminAuth.checkSession,  adminController.hideCategory)
router.post('/categories/unhide/:categoryid',adminAuth.checkSession,  adminController.unhideCategory)
router.post('/categories/new',adminAuth.checkSession,  adminController.addCategory)
router.post('/categories/edit/:categoryid',adminAuth.checkSession, adminController.editCategory)

//---- products routes ---- 
router.get('/products', adminController.getProducts)
router.post('/products/add', adminAuth.checkSession, upload.single('mainImage'), adminController.addProduct)
router.get('/products/delete/:productid', adminController.deleteProduct)
router.post('/products/activate/:productid', adminController.activateProduct)
router.post('/products/deactivate/:productid', adminController.deactivateProduct)
router.get(`/addproduct`,adminController.getAddProduct )
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