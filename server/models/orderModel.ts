import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  body: {
    type: Object,
    required: [true, "A meal must have a body"],
    message: "Input a meal name",
  },
});
const Order = mongoose.model("Order", orderSchema);

export default Order;
