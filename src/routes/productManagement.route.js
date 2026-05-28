import {Router} from "express"
import { getProducts,deleteProduct,deactivateProduct,activateProduct,getAddProduct,addProduct,getEditProduct,editProduct,productUpload } from "../controller/admin/ProductManagementController.js";


const router = Router();

router.get("/", getProducts); // get all products page
router.delete(
  "/delete/:productid",
  deleteProduct,
); // delete product
router.post(
  "/activate/:productid",
  activateProduct,
); // activate product
router.post(
  "/deactivate/:productid",
  deactivateProduct,
); // deactivate product
router
  .route("/add")
  .get(getAddProduct) // get add product page
  .post(
    productUpload.array("mainImages", 4),
    addProduct,
  ); // add product
router
  .route("/edit/:productid")
  .get(getEditProduct) // get edit product page
  .post(
    productUpload.array("mainImages", 4),
    editProduct,
  );

export default router;
