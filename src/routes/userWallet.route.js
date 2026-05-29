import { Router } from "express";
import {
  renderUserWalletPage,
  addMoney,
  verifyWalletPayment,
} from "../controller/user/userWalletController.js";

const router = Router();

router
  .route("/")
  .get(renderUserWalletPage) // get wallet
  .post(addMoney); // add money to the wallet
router.post("/verify-payment", verifyWalletPayment); // verify wallet payment

export default router;
