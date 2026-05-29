import { Router } from "express";
import {
  updateProfile,
  changePassword,
  renderUserAccountPage
} from "../controller/user/profileManagemntController.js";

const router = Router();

router.get("/",renderUserAccountPage); // get account details
router.post("/update-profile", updateProfile); // update profile
router.post("/change-password", changePassword); // change password

export default router;
