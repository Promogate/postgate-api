import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import { CountActiveSessions, CreateSession, GetAllSessions, GetSession, UpdateSession } from "../contracts/WhatsappRepository";

export default class WhatsappRepository implements
  CountActiveSessions,
  CreateSession,
  GetSession,
  UpdateSession,
  GetAllSessions {
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

  async createSession(input: CreateSession.Input): Promise<CreateSession.Output> {
    try {
      const session = await this.database.whatsappSession.create({
        data: {
          userId: input.userId,
          name: input.name,
          description: input.description
        }
      });
      return { id: session.id };
    } catch (error: any) {
      logger.error(`[WhatsappRepository|createSession]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }

  async getSession(input: GetSession.Input): Promise<GetSession.Output> {
    try {
      const session = await this.database.whatsappSession.findUnique({
        where: { id: input.id }
      });
      return session;
    } catch (error: any) {
      logger.error(`[WhatsappRepository|getSession]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }

  async update(input: UpdateSession.Input): Promise<void> {
    try {
      await this.database.whatsappSession.updateMany({
        where: { id: input.id },
        data: input
      });
    } catch (error: any) {
      logger.error(`[WhatsappRepository|update]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }

  async getAllSessions(): Promise<GetAllSessions.Output> {
    try {
      const sessions = await this.database.whatsappSession.findMany({});
      return sessions;
    } catch (error: any) {
      logger.error(`[WhatsappRepository|getAllSessions]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }
}