import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { verifyToken } from "../middleware/verifyToken";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import { SaveManyWhatsappChats } from "../interfaces/SaveManyWhatsappChats";
import logger from "../../utils/logger";

export default class ResourcesController {
  constructor(
    httpServer: HttpServer,
    readonly saveManyChatsService: SaveManyWhatsappChats
  ) {
    httpServer.on("post", "/resources/chats/save/:sessionId", [verifyToken],
      async (request: Request, response: Response) => {
        const sessionId = request.params.sessionId
        if (!sessionId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
        }
        const body = request.body;
        try {
          await saveManyChatsService.execute({ chats: body, sessionId: sessionId });
          return response.status(HttpStatusCode.CREATED).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST);
        }
      })
  }
}