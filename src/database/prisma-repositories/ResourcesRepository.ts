import { PrismaClient } from "@prisma/client";
import { GetAllChatsRespository, SaveManyChats } from "../contracts/ResourcesRepository";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";

export default class ResourcesRepository implements SaveManyChats, GetAllChatsRespository {
  constructor(readonly database: PrismaClient) { }

  async saveMany(input: SaveManyChats.Input): Promise<void> {
    try {
      await this.database.chats.createMany({
        data: input,
        skipDuplicates: true
      });
    } catch (error: any) {
      logger.error(`[WhatsappRepository|saveMany]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }

  async getAllChats(input: GetAllChatsRespository.Input): Promise<GetAllChatsRespository.Output> {
    try {
      const chats = await this.database.chats.findMany({
        where: {
          whatsappSessionId: input.sessionId
        }
      });
      return chats;
    } catch (error: any) {
      logger.error(`[WhatsappRepository|getAllChats]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }
}