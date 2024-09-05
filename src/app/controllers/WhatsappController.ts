import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import WhatsappSessionsService from "../services/WhatsappSessionsService";
import { verifyToken } from "../middleware/verifyToken";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import prisma from "../../lib/prisma";
import { SaveManyWhatsappChats } from "../interfaces/SaveManyWhatsappChats";
import logger from "../../utils/logger";
import CodechatService from "../services/CodechatService";
import EvolutionService from "../services/EvolutionService";
import AppError from "../../helpers/AppError";

export default class WhatsappController {
  constructor(
    readonly httpServer: HttpServer,
    readonly whatsappSessionsService: WhatsappSessionsService,
    readonly saveManyChatsService: SaveManyWhatsappChats,
    readonly codechatService: CodechatService,
    readonly evolutionService: EvolutionService
  ) {
    const whatsappApiService = this.getWhatsappApiService();
    httpServer.on(
      "post",
      "/whatsapp/session/create",
      [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const body = request.body;
        await whatsappApiService.connect({
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
        const body = request.body as { token: string };
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
          if (!clients) {
            return response.json({ message: "Não há clients criados pelo usuário" }).status(200);
          }
          clients.forEach(async (client) => {
            if (client.status === "" || !client.status) {
              const connectionsState = await whatsappApiService.isInstanceConnected({
                instanceName: client.id,
                token: body.token
              });
              if (connectionsState.state === "open") {
                await whatsappApiService.updateConnectionState({ id: client.id, status: "CONNECTED" });
              }
            }
          });
          return response.status(HttpStatusCode.OK).json(clients);
        } catch (error: any) {
          return response.status(HttpStatusCode.BAD_REQUEST).send({ message: error.message });
        }
      });
    httpServer.on("get", "/whatsapp/qrcode/:instanceId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const body = request.body;
        const { instanceId } = request.params as { instanceId: string };
        try {
          const result = await whatsappApiService.getQRCode({ instanceName: instanceId, token: body.token });
          return response.json(result).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error.message);
          throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
        }
      }
    )
    // httpServer.on("get", "/whatsapp/session/active-sessions", [verifyToken],
    //   async (request: Request, response: Response) => {
    //     const result = await whatsappSessionsService.countActiveSessions();
    //     return response.json(result).status(200);
    //   });
    // httpServer.on("get", "/whatsapp/get-chats/:sessionId", [verifyToken],
    //   async (request: Request, response: Response) => {
    //     const sessionId = request.params.sessionId as string;
    //     const result = await whatsappSessionsService.getChats(sessionId);
    //     return response.json(result).status(200);
    //   });
    // httpServer.on("get", "/whatsapp/sync/:sessionId", [verifyToken],
    //   async (request: Request, response: Response) => {
    //     const sessionId = request.params.sessionId as string;
    //     if (!sessionId) {
    //       return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
    //     }
    //     try {
    //       const result = await whatsappSessionsService.getChats(sessionId);
    //       await saveManyChatsService.execute({ chats: result, sessionId: sessionId });
    //       return response.status(HttpStatusCode.OK).send();
    //     } catch (error: any) {
    //       logger.error(error.message);
    //       return response.status(HttpStatusCode.BAD_REQUEST);
    //     }
    //   });
    // httpServer.on("delete", "/whatsapp/session/:sessionId", [verifyToken],
    //   async (request: Request, response: Response) => {
    //     const sessionId = request.params.sessionId as string;
    //     if (!sessionId) {
    //       return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
    //     }
    //     try {
    //       await prisma.whatsappSession.delete({ where: { id: sessionId } });
    //       return response.status(HttpStatusCode.OK).send();
    //     } catch (error: any) {
    //       logger.error(error.message);
    //       return response.status(HttpStatusCode.BAD_REQUEST);
    //     }
    //   });
  }

  private getWhatsappApiService() {
    if (process.env.WHATSAPP_ENGINE === "codechat") return this.codechatService;
    return this.evolutionService;
  }
}