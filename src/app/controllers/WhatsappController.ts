import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import WhatsappSessionsService from "../services/WhatsappSessionsService";

export default class WhatsappController {
  constructor(httpServer: HttpServer, whatsappSessionsService: WhatsappSessionsService) {
    httpServer.on("post", "/whatsapp/session/create", [], async (request: Request, response: Response) => {
      
    });

    httpServer.on("get", "/whatsapp/session/active-sessions", [], async (request: Request, response: Response) => {
      const result = await whatsappSessionsService.countActiveSessions();
      return response.json(result).status(200);
    });
  }
}