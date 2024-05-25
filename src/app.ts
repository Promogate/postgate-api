import "express-async-errors";
import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import logger from "./utils/logger";
import AppError from "./helpers/AppError";
import userRouter from "./app/router/User";
import { ExpressAdapter } from "./app/adapters/ExpressAdapter";

dotenv.config();
const app = new ExpressAdapter();

export default app;