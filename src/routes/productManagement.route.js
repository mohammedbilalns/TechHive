import { Router } from "express";
import {
  renderProductManagementPage,
  deleteProduct,
  deactivateProduct,
  activateProduct,
  addProduct,
  editProduct,
  renderAddProductPage,
  renderUpdateProductPage,
  productUpload,
} from "../controller/admin/ProductManagementController.js";

const router = Router();

router.get("/",renderProductManagementPage); // get all products page
router.delete("/delete/:productid", deleteProduct); // delete product
router.post("/activate/:productid", activateProduct); // activate product
router.post("/deactivate/:productid", deactivateProduct); // deactivate product
router
  .route("/add")
  .get(renderAddProductPage) // get add product page
  .post(productUpload.array("mainImages", 4), addProduct); // add product
router
  .route("/edit/:productid")
  .get(renderUpdateProductPage) // get edit product page
  .post(productUpload.array("mainImages", 4), editProduct);

export default router;
