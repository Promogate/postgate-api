import { Client } from "whatsapp-web.js";
import WhatsappRepository from "../../database/prisma-repositories/WhatsappRepository";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import { CountActiveSessions } from "../../database/contracts/WhatsappRepository";

export default class WhatsappSessionsService {
  sessions: Client[] = []

  constructor(readonly whatsappRepository: CountActiveSessions) {}

  async countActiveSessions(): Promise<{ activeSessions: number }> {
    try {
      const result = await this.whatsappRepository.countActiveSessions();
      return result;
    } catch (error: any) {
      logger.error(`[WhatsappSessionsService|countActiveSessions]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }
}