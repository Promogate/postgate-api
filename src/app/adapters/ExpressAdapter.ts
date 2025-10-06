import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import http from "http";
const asyncErrors = require("express-async-errors");

import path from "path";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import logger from "../../utils/logger";
import { HttpServer } from "../interfaces/HttpServer";

export class ExpressAdapter implements HttpServer {
  app: Express;
  server: http.Server;

  constructor() {
    asyncErrors;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json({
      limit: "200mb",
      verify: function (req: Request & { rawBody?: Buffer }, res, buf, encoding) {
        req.rawBody = buf
      },
    }));
    this.app.use(express.static(path.join(__dirname, "../../../public")));

    this.app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
      if (err instanceof AppError) {
        logger.warn(err);
        return res.status(err.statusCode).json({ error: err.message });
      }

      logger.error(err);
      return res.status(500).json({ error: "Internal server error" });
    });
    this.server = http.createServer(this.app);
  }

  on(method: string, url: string, middlewares: Function[], callback: (request: Request, response: Response) => Promise<any>): void {
    this.app._router[method](url, [...middlewares], async function (req: Request, res: Response) {
      try {
        const output = await callback(req, res);
        return output;
      } catch (error: any) {
        logger.error(error.message);
        throw new AppError({
          message: error.message,
          statusCode: HttpStatusCode.BAD_REQUEST
        });
      }
    });
  }

  listen(port: string | number | undefined): http.Server {
    if (typeof port === "string") {
      const PORT = Number(port);
      this.app.listen(PORT, () => logger.info(`Server is running on port: ${PORT}`));
    } else {
      this.app.listen(port, () => logger.info(`Server is running on port: ${port}`));
    }
    return this.server;
  }

  getServer(): Express {
    return this.app;
  }
}