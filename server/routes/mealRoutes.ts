import express from "express";
import {
  deleteMeal,
  updateMeal,
  createMeal,
  getAllMeal,
  getMeal,
} from "./../controllers/mealController";

const router = express.Router();

router.route("/").get(getAllMeal).post(createMeal);
router.route("/:id").get(getMeal).delete(deleteMeal).patch(updateMeal);

export default router;
