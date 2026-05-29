import { Router } from "express";
import {
  getCustomers,
  blockCustomer,
  unblockCustomer,
} from "../controller/admin/CustomerManagementController.js";

const router = Router();

router.get("/", getCustomers); // get all customers page
router.post("/block/:customerid", blockCustomer); // block customer
router.post("/unblock/:customerid", unblockCustomer); // unblock customer

export default router;
