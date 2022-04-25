import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import ErrorHandler from "./utils/appError";
const nodemailer = require("nodemailer");
import globalErrorHandler from "./controllers/errorController";
import mealRoutes from "./routes/mealRoutes";
import ordersRoutes from "./routes/ordersRoutes";
import { google, Auth } from "googleapis";
import { gmail } from "googleapis/build/src/apis/gmail";

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

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

console.log(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REFRESH_TOKEN);

const oauthClient: Auth.OAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauthClient.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

app.use("/api/meal", mealRoutes);
app.use("/api/orders", ordersRoutes);
app.post("/send_mail", async (req, res) => {
  async function sendMail() {
    try {
      let { order } = req.body;
      let { formData, cartItems, totalAmount } = order;
      const accessToken = await oauthClient.getAccessToken();
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL,
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });
      const mailOptions = {
        from: "Edugiehomes",

        to: formData.email,
        subject: `${formData.fullName} just placed an Order`,
        text: "hello from gmail using api",
        html: `<h1>${formData.fullName} placed an order</h1>
        ${formData.fullName} with the phone number ${
          formData.phone
        } placed an order
          
             Customer is Located in suit ${formData.suite}
             this customer can be reached with the email ${formData.email}
          
                            ${formData.fullName} ordered
          
             ${cartItems.map(
               (item: any) =>
                 item.qty +
                 " " +
                 item.title +
                 " at ₦" +
                 item.price +
                 " each...."
             )}
             The total cost for this order is ₦${totalAmount}
          
             Waiting for the confirmation Call, ${formData.fullName}`,
      };

      const result = await transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      return error;
    }
  }

  sendMail()
    .then((result) => console.log("email sent ....", result))
    .catch((error) => console.log(error.message));
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
