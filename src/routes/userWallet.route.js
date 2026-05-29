import { Router } from "express";
import {
  getWallet,
  addMoney,
  verifyWalletPayment,
} from "../controller/user/userWalletController.js";

const router = Router();

router
  .route("/")
  .get(getWallet) // get wallet
  .post(addMoney); // add money to the wallet
router.post("/verify-payment", verifyWalletPayment); // verify wallet payment

export default router;
