import { SaveManyChats } from "../../database/contracts/ResourcesRepository";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import logger from "../../utils/logger";
import { SaveManyWhatsappChats } from "../interfaces/SaveManyWhatsappChats";

export default class SaveManyWhatsappChatService implements SaveManyWhatsappChats {
  constructor(readonly resourcesRepository: SaveManyChats) { }

  async execute(input: SaveManyWhatsappChats.Input): Promise<void> {
    try {
      const chats = input.chats.map(chat => {
        return {
          whatsappId: chat.id._serialized,
          whatsappName: chat.name,
          whatsappSessionId: input.sessionId,
          isGroup: chat.isGroup
        }
      });
      await this.resourcesRepository.saveMany(chats);
    } catch (error: any) {
      logger.error(`[SaveManyWhatsappChatService] - ${error.message}`);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }
}