import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import { CountActiveSessions } from "../contracts/WhatsappRepository";

export default class WhatsappRepository implements CountActiveSessions {
  constructor(readonly database: PrismaClient) { }

  async countActiveSessions(): Promise<CountActiveSessions.Output> {
    try {
      const activeSessions = await this.database.whatsappSession.count();
      return { activeSessions };
    } catch (error: any) {
      logger.error(`[WhatsappRepository|countActiveSessions]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }
}