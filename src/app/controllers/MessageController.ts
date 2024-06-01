import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { MessageMedia, MessageSendOptions } from "whatsapp-web.js";
import WhatsappSessionsService from "../services/WhatsappSessionsService";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import logger from "../../utils/logger";

export default class MessageController {
  constructor(httpServer: HttpServer, whatsappService: WhatsappSessionsService) {
    httpServer.on("post", "/messages/send-media/:sessionId", [], async (request: Request, response: Response) => {
      const body = request.body;
      const { sessionId } = request.params as { sessionId: string };
      if (!sessionId) return response.status(HttpStatusCode.BAD_REQUEST).send("Missing sessionId");
      try {
        const session = whatsappService.getSession(sessionId)
        if (!session) return response.status(HttpStatusCode.BAD_REQUEST).send("Missing sessionId");
        const media = await MessageMedia.fromUrl(body.data.media);
        let mediaOptions: MessageSendOptions = {
          caption: body.data.caption,
          sendAudioAsVoice: true
        }
        if (media.mimetype.startsWith('image/') && ! /^.*\.(jpe?g|png|gif)?$/i.exec(media.filename as string)) {
          mediaOptions['sendMediaAsDocument'] = true;
        }
        await session.sendMessage(body.data.whatsappId, media, mediaOptions)
        return response.status(HttpStatusCode.OK).send("Message Sent");
      } catch (error: any) {
        logger.error(error);
        return response.status(HttpStatusCode.BAD_REQUEST).send(error.message);
      }
    });
  }
}