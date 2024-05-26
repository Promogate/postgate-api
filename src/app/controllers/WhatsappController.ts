import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import WhatsappSessionsService from "../services/WhatsappSessionsService";
import { verifyToken } from "../middleware/verifyToken";

export default class WhatsappController {
  constructor(httpServer: HttpServer, whatsappSessionsService: WhatsappSessionsService) {
    httpServer.on(
      "post",
      "/whatsapp/session/create",
      [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        await whatsappSessionsService.createSession({ userId: request.user as string });
        return response.status(200).send();
      });

    httpServer.on("get", "/whatsapp/session/active-sessions", [], async (request: Request, response: Response) => {
      const result = await whatsappSessionsService.countActiveSessions();
      return response.json(result).status(200);
    });
  }
}