import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import WhatsappSessionsService from "../services/WhatsappSessionsService";
import { verifyToken } from "../middleware/verifyToken";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import prisma from "../../lib/prisma";
import { SaveManyWhatsappChats } from "../interfaces/SaveManyWhatsappChats";
import logger from "../../utils/logger";

export default class WhatsappController {
  constructor(
    httpServer: HttpServer,
    whatsappSessionsService: WhatsappSessionsService,
    saveManyChatsService: SaveManyWhatsappChats
  ) {
    httpServer.on(
      "post",
      "/whatsapp/session/create",
      [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const body = request.body;
        await whatsappSessionsService.createSession({
          userId: request.user as string,
          name: body.name,
          description: body.description
        });
        return response.status(200).send();
      });
    httpServer.on(
      "get",
      "/whatsapp/sessions",
      [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        try {
          const userId = request.user;
          if (!userId) {
            return response.status(HttpStatusCode.BAD_REQUEST).send({ message: "Usuário não encontrado" });
          }
          const clients = await prisma.whatsappSession.findMany({
            where: {
              userId: userId
            }
          });
          return response.status(HttpStatusCode.OK).json(clients);
        } catch (error: any) {
          return response.status(HttpStatusCode.BAD_REQUEST).send({ message: error.message });
        }
      });
    httpServer.on("get", "/whatsapp/session/active-sessions", [verifyToken],
      async (request: Request, response: Response) => {
        const result = await whatsappSessionsService.countActiveSessions();
        return response.json(result).status(200);
      });
    httpServer.on("get", "/whatsapp/get-chats/:sessionId", [verifyToken],
      async (request: Request, response: Response) => {
        const sessionId = request.params.sessionId as string;
        const result = await whatsappSessionsService.getChats(sessionId);
        return response.json(result).status(200);
      });
    httpServer.on("get", "/whatsapp/sync/:sessionId", [verifyToken],
      async (request: Request, response: Response) => {
        const sessionId = request.params.sessionId as string;
        if (!sessionId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
        }
        try {
          const result = await whatsappSessionsService.getChats(sessionId);
          await saveManyChatsService.execute({ chats: result, sessionId: sessionId });
          return response.status(HttpStatusCode.OK).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST);
        }
      });
    httpServer.on("delete", "/whatsapp/session/:sessionId", [verifyToken],
      async (request: Request, response: Response) => {
        const sessionId = request.params.sessionId as string;
        if (!sessionId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
        }
        try {
          await prisma.whatsappSession.delete({ where: { id: sessionId } });
          return response.status(HttpStatusCode.OK).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST);
        }
      });
  }
}