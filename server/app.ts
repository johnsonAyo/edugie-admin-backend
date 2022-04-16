import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import ErrorHandler from "./utils/appError";
import globalErrorHandler from "./controllers/errorController";
import mealRoutes from "./routes/mealRoutes";

const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

// Start express app
const app = express();
const corsOptions ={
    origin:'*',
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
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
