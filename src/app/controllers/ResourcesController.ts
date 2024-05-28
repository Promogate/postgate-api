import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { verifyToken } from "../middleware/verifyToken";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import { SaveManyWhatsappChats } from "../interfaces/SaveManyWhatsappChats";
import logger from "../../utils/logger";
import { GetAllChats } from "../interfaces/GetAllChats";
import { CreateSendingList } from "../interfaces/CreateSendingList";

export default class ResourcesController {
  constructor(
    httpServer: HttpServer,
    readonly saveManyChatsService: SaveManyWhatsappChats,
    readonly getAllChatsService: GetAllChats,
    readonly createSendingList: CreateSendingList
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
    httpServer.on("post", "/resources/sending-list/save", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const userId = request.user;
        if (!userId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
        }
        const body = request.body;
        try {
          await createSendingList.execute({
            chats: body.chats,
            name: body.name,
            userId: userId
          });
          return response.status(HttpStatusCode.CREATED).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST);
        }
      })
    httpServer.on("get", "/resources/chats/get-all/:sessionId", [verifyToken],
      async (request: Request, response: Response) => {
        const sessionId = request.params.sessionId
        if (!sessionId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
        }
        try {
          const result = await getAllChatsService.execute({ sessionId: sessionId });
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST);
        }
      })
  }
}