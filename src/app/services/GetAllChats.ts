import { GetAllChatsRespository } from "../../database/contracts/ResourcesRepository";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import logger from "../../utils/logger";
import { GetAllChats } from "../interfaces/GetAllChats";

export default class GetAllChatsService implements GetAllChats {
  constructor(readonly resourcesRepository: GetAllChatsRespository) {}

  async execute(input: GetAllChats.Input): Promise<GetAllChats.Output> {
    try {
      const result = await this.resourcesRepository.getAllChats({ sessionId: input.sessionId });
      return result;
    } catch(error: any) {
      logger.error(error.message);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }
}