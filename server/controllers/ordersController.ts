import Order from "../models/orderModel";
import catchAsync from "../utils/catchAsync";
import { NextFunction, Response } from "express";
import { CustomReq } from "../models/custom";

import { getAll, getOne, updateOne, deleteOne } from "./handlerFactory";

const updateOrder = updateOne(Order);
const deleteOrder = deleteOne(Order);
const getAllOrders = getAll(Order);
const getOrder = getOne(Order, "");

const createOrder = catchAsync(
  async (req: CustomReq, res: Response, next: NextFunction) => {
    const { body } = req.body;

    let createOrder = await Order.create({
      body,
    });
    res.status(201).json({
      status: "success",
      data: {
        data: createOrder,
      },
    });
  }
);

export { deleteOrder, updateOrder, createOrder, getAllOrders, getOrder };
