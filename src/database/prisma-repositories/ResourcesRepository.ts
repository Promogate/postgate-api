import { PrismaClient } from "@prisma/client";
import { GetAllChatsRespository, SaveChat, SaveManyChats, SaveSendingList } from "../contracts/ResourcesRepository";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import prisma from "../../lib/prisma";

export default class ResourcesRepository implements SaveManyChats, GetAllChatsRespository, SaveSendingList, SaveChat {
  constructor(readonly database: PrismaClient) { }

  async saveChat(input: { whatsappId: string; whatsappName: string; whatsappSessionId: string; isGroup: boolean; }): Promise<void> {
    try {
      await this.database.chats.upsert({
        where: {
          whatsappId: input.whatsappId
        },
        create: {
          whatsappId: input.whatsappId,
          whatsappName: input.whatsappName,
          isGroup: input.isGroup,
          whatsappSessionId: input.whatsappSessionId
        },
        update: {
          whatsappId: input.whatsappId,
          whatsappName: input.whatsappName,
          isGroup: input.isGroup,
          whatsappSessionId: input.whatsappSessionId
        }
      })
    } catch (error: any) {
      logger.error(`[WhatsappRepository|saveChat]: ${error.message}`);
      throw new AppError({
        message: error,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }

  async saveMany(input: SaveManyChats.Input): Promise<void> {
    try {
      prisma.chats.createMany({
        skipDuplicates: true,
        data: input
      })
        .then((chats) => {
          logger.info(`Chats processed: ${chats.count}`);
        })
        .catch((error) => {
          logger.error("failed on createMany")
        })
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

  async saveSendingList(input: SaveSendingList.Input): Promise<SaveSendingList.Output> {
    try {
      await this.database.sendingList.create({
        data: {
          name: input.name,
          list: input.list,
          userId: input.userId
        }
      });
    } catch (error: any) {
      logger.error(`[WhatsappRepository|saveSendingList]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }
}