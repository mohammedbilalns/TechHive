import { Router } from "express";
import {
  renderUserAddressesPage,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../controller/user/useraddressController.js";

const router = Router();

router
  .route("/")
  .get(renderUserAddressesPage) // get all addresses
  .post(addAddress); // add address
router.route("/:id").put(updateAddress).delete(deleteAddress).get(getAddress);
export default router;
