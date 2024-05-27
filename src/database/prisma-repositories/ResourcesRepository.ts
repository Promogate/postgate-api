import { PrismaClient } from "@prisma/client";
import { SaveManyChats } from "../contracts/ResourcesRepository";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";

export default class ResourcesRepository implements SaveManyChats {
  constructor(readonly database: PrismaClient) { }

  async saveMany(input: SaveManyChats.Input): Promise<void> {
    try {
      await this.database.chats.createMany({
        data: input,
        skipDuplicates: true
      });
    } catch (error: any) {
      logger.error(`[WhatsappRepository|update]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }
}