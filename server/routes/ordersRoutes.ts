import express from "express";
import {
  deleteOrder,
  updateOrder,
  createOrder,
  getAllOrders,
  getOrder,
} from "./../controllers/ordersController";

const router = express.Router();

router.route("/").get(getAllOrders).post(createOrder);
router.route("/:id").get(getOrder).delete(deleteOrder).patch(updateOrder);

export default router;
