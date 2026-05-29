import { Router } from "express";
import {
  editCategory,
  enableCategory,
  disableCategory,
  deleteCategory,
  getCategories,
  addCategory,
} from "../controller/admin/CategoryMangementController.js";

const router = Router();

router.get("/", getCategories); // get all categories page
router.delete("/:categoryid", deleteCategory); // delete category
router.post("/hide/:categoryid", disableCategory); // hide category
router.post("/unhide/:categoryid", enableCategory); // unhide category
router.post("/new", addCategory); // add category
router.post("/edit/:categoryid", editCategory); // edit category

export default router;
