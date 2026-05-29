import { Router } from "express";
import {
  getAddresses,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../controller/user/useraddressController.js";

const router = Router();

router
  .route("/")
  .get(getAddresses) // get all addresses
  .post(addAddress); // add address
router.route("/:id").put(updateAddress).delete(deleteAddress).get(getAddress);
export default router;
