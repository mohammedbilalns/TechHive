import { Router } from "express";
import {
  addReview,
  getReview,
} from "../controller/user/userReviewsController.js";
const router = Router();

router.post("/add", addReview); // add review
router.get("/get", getReview); // get review

export default router;
