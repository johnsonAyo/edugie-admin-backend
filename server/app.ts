import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import ErrorHandler from "./utils/appError";
import nodemailer from "nodemailer";
import globalErrorHandler from "./controllers/errorController";
import mealRoutes from "./routes/mealRoutes";
import ordersRoutes from "./routes/ordersRoutes";

const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

// Start express app
const app = express();
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

const DB = (process.env.DATABASE as string).replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD as string
);

mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log(`DB connection successful!`));

// 3) ROUTES

app.use("/api/meal", mealRoutes);
app.use("/api/orders", ordersRoutes);
app.post("/send_mail", async (req, res) => {
  let { order } = req.body;
  let { formData, cartItems, totalAmount } = order;
  const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 0,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: "test@test.com",
    subject: "Test Email",
    html: `<div className = "email" styles="
    border:1px solid black;
    padding:20px;
    font-size: 20px;
    line-height: 2;
    ">
    <h2> ${formData.fullName}'s Order</h2>
    <p>${formData.fullName} with the phone number  ${
      formData.phone + " placed an order"
    } </p>
    <p>Customer is Located in suit ${
      formData.suite
    } and can be reached with the email  ${
      formData.email
    } the order is as folllow </p>
    <p>${cartItems.map(
      (item: any) =>
        item.qty + " " + item.title + " at ₦" + item.price + " each...."
    )} </p>
    <p>The total cost for this order is ₦${totalAmount} </p>
    
  
    <p> Waiting for the confirmation Call, ${formData.fullName} </p>
    </div>`,
  });
  console.log("msg sent");
  res.status(201).json({
    status: "success",
    data: {
      data: order,
    },
  });
});

app.all("*", (req, res, next) => {
  next(
    ErrorHandler(
      404,
      `Can't find ${req.originalUrl} on this server, login via a Post Request to /users/login. Visit postman documentation for more information`,
      {}
    )
  );
});

app.use(globalErrorHandler);

export default app;
