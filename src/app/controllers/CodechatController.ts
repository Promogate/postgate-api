import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { verifyToken } from "../middleware/verifyToken";
import CodechatService from "../services/CodechatService";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";

export default class CodechatController {
  constructor(httpServer: HttpServer, codechatService: CodechatService) {
    httpServer.on("post", "/codechat/create", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const userId = request.user as string;
        const body = request.body;
        try {
          const result = await codechatService.connect({
            userId: userId,
            name: body.name,
            description: body.description
          });
          return response.json(result).status(HttpStatusCode.CREATED);
        } catch (error: any) {
          logger.error(error.message);
          throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
        }
      });
  }
}