import { AxiosInstance } from "axios";
import { CreateSession, UpdateSession } from "../../database/contracts/WhatsappRepository";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import codechat from "../../lib/codechat";
import logger from "../../utils/logger";

export default class CodechatService {
  client: AxiosInstance

  constructor(readonly whatsappRepository: CreateSession & UpdateSession) {
    this.client = codechat();
  }

  async connect(input: CreateSession.Input) {
    try {
      const { id } = await this.whatsappRepository.createSession({
        userId: input.userId,
        name: input.name,
        description: input.description
      });
      const { data } = await this.client.post("/instance/create", {
        instanceName: id,
        description: input.description
      });
      await this.whatsappRepository.update({
        id: id,
        token: data.Auth.token
      })
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        Auth: {
          id: data.Auth.id,
          token: data.Auth.token
        }
      }
    } catch (error: any) {
      logger.error(error.message);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }
}