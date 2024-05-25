import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import logger from "./utils/logger";
import AppError from "./helpers/AppError";

dotenv.config();
const app = express();
app.use(express.json());

app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;