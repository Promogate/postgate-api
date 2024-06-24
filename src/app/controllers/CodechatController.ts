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

    httpServer.on("get", "/codechat/qrcode/:instanceId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const body = request.body;
        const { instanceId } = request.params as { instanceId: string };
        try {
          const result = await codechatService.getQRCode({ instanceName: instanceId, token: body.token });
          return response.json(result).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error.message);
          throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
        }
      }
    )

    httpServer.on("get", "/codechat/sync/:instanceId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const { instanceId } = request.params as { instanceId: string };
        const body = request.body;
        try {
          const result = await codechatService.syncChats({ instanceName: instanceId, token: body.token });
          return response.json(result).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error.message);
          throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
        }
      }
    )

    httpServer.on("post", "/codechat/getChats/:instanceId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const { instanceId } = request.params as { instanceId: string };
        const body = request.body;
        try {
          const result = await codechatService.findChats({ instanceName: instanceId, token: body.token });
          return response.json(result).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error.message);
          throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
        }
      }
    )
  }
}