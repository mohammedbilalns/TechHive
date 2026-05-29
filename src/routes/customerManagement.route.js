import { Router } from "express";
import {
  renderCustomersPage,
  blockCustomer,
  unblockCustomer,
} from "../controller/admin/CustomerManagementController.js";

const router = Router();

router.get("/",renderCustomersPage); // get all customers page
router.post("/block/:customerid", blockCustomer); // block customer
router.post("/unblock/:customerid", unblockCustomer); // unblock customer

export default router;
