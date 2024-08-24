import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { verifyToken } from "../middleware/verifyToken";
import CodechatService from "../services/CodechatService";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import { MediaMessage } from "../../utils/@types";

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

    httpServer.on("get", "/codechat/get_chats/:instanceId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const { instanceId } = request.params as { instanceId: string };
        const body = request.body;
        try {
          const result = await codechatService.getChats({ instanceName: instanceId, token: body.token });
          return response.json(result).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error);
          throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
        }
      }
    )

    httpServer.on("post", "/codechat/sync_chat/:instanceId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const { instanceId } = request.params as { instanceId: string };
        const body = request.body;
        try {
          await codechatService.processItem({
            instanceName: instanceId,
            token: body.token,
            item: body.item
          });
          return response.json({ message: "Processado com sucesso!" }).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error);
          throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
        }
      }
    )

    httpServer.on("post", "/codechat/sync_chats/:instanceId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const { instanceId } = request.params as { instanceId: string };
        const body = request.body;
        try {
          await codechatService.processItems({
            instanceName: instanceId,
            token: body.token,
            chats: body.chats
          });
          return response.json({ message: "Processado com sucesso!" }).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error);
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

    httpServer.on("post", "/codechat/send_media_message/:instanceId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const body = request.body as MediaMessage;
        const { instanceId } = request.params as { instanceId: string };
        if (!instanceId) throw new AppError({
          message: "Missing instance id",
          statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY
        });
        try {
          const result = await codechatService.sendMediaMessage({ ...body, sessionId: instanceId });
          return response.json(result).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error.message);
          throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
        }
      }
    );
  }
}