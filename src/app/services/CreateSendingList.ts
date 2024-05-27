import { SaveSendingList } from "../../database/contracts/ResourcesRepository";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import logger from "../../utils/logger";
import { stringifyCircularJSON } from "../../utils/stringifyCircularJSON";
import { CreateSendingList } from "../interfaces/CreateSendingList";

export class CreateSendingListService implements CreateSendingList {
  constructor(readonly resourcesRepository: SaveSendingList) { }

  async execute(input: CreateSendingList.Input): Promise<CreateSendingList.Output> {
    try {
      const stringifiedChats = stringifyCircularJSON(input.chats);
      await this.resourcesRepository.saveSendingList({
        name: input.name,
        list: stringifiedChats,
        userId: input.userId
      });
    } catch (error: any) {
      logger.error(`[CreateSendingListService] - ${error.message}`);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }
}