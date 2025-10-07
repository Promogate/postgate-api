import { Request, Response } from "express";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import prisma from "../../lib/prisma";
import { MediaMessage, RequestTextMessage } from "../../utils/@types";
import logger from "../../utils/logger";
import { HttpServer } from "../interfaces/HttpServer";
import { SaveManyWhatsappChats } from "../interfaces/SaveManyWhatsappChats";
import { verifyToken } from "../middleware/verifyToken";
import CodechatService from "../services/CodechatService";
import EvolutionService from "../services/EvolutionService";
import WhatsappSessionsService from "../services/WhatsappSessionsService";

export default class WhatsappController {
  constructor(
    readonly httpServer: HttpServer,
    readonly whatsappSessionsService: WhatsappSessionsService,
    readonly saveManyChatsService: SaveManyWhatsappChats,
    readonly codechatService: CodechatService,
    readonly evolutionService: EvolutionService
  ) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const whatsappApiService = this.getWhatsappApiService();

    // Create WhatsApp session
    this.httpServer.on(
      "post",
      "/whatsapp/session/create",
      [verifyToken],
      this.handleCreateSession.bind(this)
    );

    // Get user sessions
    this.httpServer.on(
      "get",
      "/whatsapp/sessions",
      [verifyToken],
      this.handleGetSessions.bind(this)
    );

    // Get QR code for session
    this.httpServer.on(
      "get",
      "/whatsapp/qrcode/:instanceId",
      [verifyToken],
      this.handleGetQRCode.bind(this)
    );

    // Sync chats
    this.httpServer.on(
      "get",
      "/whatsapp/sync_chats/:instanceId",
      [verifyToken],
      this.handleSyncChats.bind(this)
    );

    // Send media message
    this.httpServer.on(
      "post",
      "/whatsapp/send_media_message/:instanceId",
      [verifyToken],
      this.handleSendMediaMessage.bind(this)
    );

    // Send text message
    this.httpServer.on(
      "post",
      "/whatsapp/send_text_message/:instanceId",
      [verifyToken],
      this.handleSendTextMessage.bind(this)
    );

    // Delete session
    this.httpServer.on(
      "delete",
      "/whatsapp/session/:sessionId",
      [verifyToken],
      this.handleDeleteSession.bind(this)
    );

    // Get groups for instance
    this.httpServer.on(
      "get",
      "/whatsapp/chats/:instanceId",
      [verifyToken],
      this.handleGetGroups.bind(this)
    );
  }

  private async handleCreateSession(
    request: Request & { user?: string },
    response: Response
  ): Promise<Response> {
    try {
      const body = request.body;
      const whatsappApiService = this.getWhatsappApiService();

      await whatsappApiService.connect({
        userId: request.user as string,
        name: body.name,
        description: body.description,
      });

      return response.status(HttpStatusCode.OK).send();
    } catch (error: any) {
      logger.error(error.message);
      return response
        .status(HttpStatusCode.BAD_REQUEST)
        .send({ message: error.message });
    }
  }

  private async handleGetSessions(
    request: Request & { user?: string },
    response: Response
  ): Promise<Response> {
    try {
      const body = request.body as { token: string };
      const userId = request.user;

      if (!userId) {
        return response.status(HttpStatusCode.BAD_REQUEST).send({
          message: "Usuário não encontrado",
        });
      }

      const clients = await prisma.whatsappSession.findMany({
        where: { userId: userId },
      });

      if (!clients || clients.length === 0) {
        return response.status(HttpStatusCode.OK).json({
          message: "Não há clients criados pelo usuário",
        });
      }

      const whatsappApiService = this.getWhatsappApiService();
      for (const client of clients) {
        if (client.status === "" || !client.status) {
          try {
            const connectionsState =
              await whatsappApiService.isInstanceConnected({
                instanceName: client.id,
                token: body.token,
              });

            if (connectionsState.state === "open") {
              await whatsappApiService.updateConnectionState({
                id: client.id,
                status: "CONNECTED",
              });
            }
          } catch (error) {
            logger.error(
              `Error checking connection for client ${client.id}:`,
              error
            );
          }
        }
      }

      return response.status(HttpStatusCode.OK).json(clients);
    } catch (error: any) {
      logger.error(error.message);
      return response
        .status(HttpStatusCode.BAD_REQUEST)
        .send({ message: error.message });
    }
  }

  private async handleGetQRCode(
    request: Request & { user?: string },
    response: Response
  ): Promise<Response> {
    try {
      const body = request.body;
      const { instanceId } = request.params as { instanceId: string };
      const whatsappApiService = this.getWhatsappApiService();

      const result = await whatsappApiService.getQRCode({
        instanceName: instanceId,
        token: body.token,
      });

      return response.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      logger.error(error.message);
      return response
        .status(HttpStatusCode.BAD_REQUEST)
        .send({ message: error.message });
    }
  }

  private async handleSyncChats(
    request: Request & { user?: string },
    response: Response
  ): Promise<Response> {
    try {
      const { instanceId } = request.params as { instanceId: string };
      const body = request.body;
      const whatsappApiService = this.getWhatsappApiService();

      await whatsappApiService.processItems({
        instanceName: instanceId,
        token: body.token,
        chats: body.chats,
      });

      return response.status(HttpStatusCode.OK).json({
        message: "Processado com sucesso!",
      });
    } catch (error: any) {
      logger.error(error);
      return response
        .status(HttpStatusCode.BAD_REQUEST)
        .send({ message: error.message });
    }
  }

  private async handleSendMediaMessage(
    request: Request & { user?: string },
    response: Response
  ): Promise<Response> {
    try {
      const body = request.body as MediaMessage;
      const user = request.user as string;
      const { instanceId } = request.params as { instanceId: string };

      if (!instanceId) {
        return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({
          message: "Missing instance id",
        });
      }

      const whatsappApiService = this.getWhatsappApiService();
      const result = await whatsappApiService.sendMediaMessage({
        ...body,
        sessionId: instanceId,
        userId: user,
      });

      return response.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      logger.error(error.message);
      return response
        .status(HttpStatusCode.BAD_REQUEST)
        .send({ message: error.message });
    }
  }

  private async handleSendTextMessage(
    request: Request & { user?: string },
    response: Response
  ): Promise<Response> {
    try {
      const body = request.body as RequestTextMessage;
      const user = request.user as string;
      const { instanceId } = request.params as { instanceId: string };

      if (!instanceId) {
        return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({
          message: "Missing instance id",
        });
      }

      const whatsappApiService = this.getWhatsappApiService();
      const result = await whatsappApiService.sendTextMessage({
        userId: user,
        sessionId: instanceId,
        number: body.number,
        delay: body.message.delay,
        linkPreview: body.message.linkPreview,
        mentionsEveryOne: body.message.mentionsEveryOne,
        text: body.message.text,
      });

      return response.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      logger.error(error.message);
      return response
        .status(HttpStatusCode.BAD_REQUEST)
        .send({ message: error.message });
    }
  }

  private async handleDeleteSession(
    request: Request,
    response: Response
  ): Promise<Response> {
    try {
      const sessionId = request.params.sessionId as string;

      if (!sessionId) {
        return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({
          message: "Session ID is missing!",
        });
      }

      await this.evolutionService.deleteWhatsappSession(sessionId);
      await prisma.whatsappSession.delete({ where: { id: sessionId } });

      return response.status(HttpStatusCode.OK).send();
    } catch (error: any) {
      logger.error(error.message);
      return response
        .status(HttpStatusCode.BAD_REQUEST)
        .send({ message: error.message });
    }
  }

  private async handleGetGroups(
    request: Request & { user?: string },
    response: Response
  ): Promise<Response> {
    try {
      const { instanceId } = request.params as { instanceId: string };
      const body = request.body;

      if (!instanceId) {
        return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({
          message: "Instance ID is missing!",
        });
      }

      const whatsappApiService = this.getWhatsappApiService();
      const groups = await whatsappApiService.fetchAllGroups({
        instanceName: instanceId,
        token: body.token,
      });

      return response.status(HttpStatusCode.OK).json(groups);
    } catch (error: any) {
      logger.error(error.message);
      return response
        .status(HttpStatusCode.BAD_REQUEST)
        .send({ message: error.message });
    }
  }

  private getWhatsappApiService() {
    if (process.env.WHATSAPP_ENGINE === "codechat") {
      return this.codechatService;
    }
    return this.evolutionService;
  }
}
