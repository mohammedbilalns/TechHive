import { Router } from "express";
import {
  getOffers,
  addOffer,
  getOfferDetails,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
} from "../controller/admin/OfferManagementController.js";

const router = Router();

router.get("/", getOffers); // get all offers page
router.post("/", addOffer); // add offer
router
  .route("/:offerId")
  .get(getOfferDetails) // get offer details
  .put(updateOffer) // update offer
  .delete(deleteOffer); // delete offer
router.patch("/:offerId/toggle-status", toggleOfferStatus); // toggle offer status

export default router;
