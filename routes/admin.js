import express from "express"
import { Router } from "express"
import adminController from "../controller/adminController.js"
import adminAuth from "../middlewares/adminAuth.js"

const router = Router()

router.use(express.static('static'))


router.get('/login', adminAuth.isLogin, adminController.loadLogin)
router.post('/login', adminAuth.isLogin, adminController.verifyLogin )



const customers = [
  { id: 1, name: "John Doe", phone: "123-456-7890", email: "john@example.com", status: "Active" },
  { id: 2, name: "Jane Smith", phone: "987-654-3210", email: "jane@example.com", status: "Blocked" },
  { id: 1, name: "John Doe", phone: "123-456-7890", email: "john@example.com", status: "Active" },
  { id: 1, name: "John Doe", phone: "123-456-7890", email: "john@example.com", status: "Active" },
  { id: 1, name: "John Doe", phone: "123-456-7890", email: "john@example.com", status: "Active" },
  { id: 1, name: "John Doe", phone: "123-456-7890", email: "john@example.com", status: "Active" },


];

// Render the customer list
router.get('/users', (req, res) => {
  res.render('admin/userdashboard', { customers });
});
export default router