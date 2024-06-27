import { AxiosInstance, AxiosResponse } from "axios";
import { CreateSession, UpdateSession } from "../../database/contracts/WhatsappRepository";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import { codechat } from "../../lib/codechat";
import logger from "../../utils/logger";
import { SaveChat } from "../../database/contracts/ResourcesRepository";
import checkIfIsGroup from "../../helpers/CheckIfIsAGroup";
import prisma from "../../lib/prisma";
import Bluebird from "bluebird";
import retry from "bluebird-retry";

export default class CodechatService {
  client: AxiosInstance

  constructor(
    readonly whatsappRepository: CreateSession & UpdateSession,
    readonly resourcesRepository: SaveChat
  ) {
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

  async getQRCode(input: { instanceName: string, token: string }) {
    try {
      const { data } = await this.client.get(`/instance/connect/${input.instanceName}`, {
        headers: {
          Authorization: `Bearer ${input.token}`
        }
      });
      return data;
    } catch (error: any) {
      logger.error(error.message);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }

  async isInstanceConnected(input: { instanceName: string, token: string }): Promise<{
    state: string,
    statusReason: number
  }> {
    try {
      const { data } = await this.client.get(`/instance/connectionState/${input.instanceName}`, {
        headers: {
          Authorization: `Bearer ${input.token}`
        }
      });
      return data;
    } catch (error: any) {
      logger.error(error.message);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }

  async updateConnectionState(input: UpdateSession.Input): Promise<void> {
    try {
      const result = await this.whatsappRepository.update({ ...input, id: input.id, })
      return result;
    } catch (error: any) {
      logger.error(error.message);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }

  async syncChats(input: { token: string, instanceName: string }): Promise<any> {
    const instanceName = input.instanceName;
    const session = await prisma.whatsappSession.findUnique({ where: { id: instanceName } });
    if (!session) {
      throw new AppError({ message: "Session not found", statusCode: HttpStatusCode.NOT_FOUND });
    }
    const result = await this.client.get<{
      id: string,
      remoteJid: string,
      createdAt: string,
      updatedAt: string,
      instanceId: number
    }[]>(`/chat/findChats/${instanceName}`, {
      headers: {
        Authorization: `Bearer ${input.token}`
      }
    })
    if (!result.data) throw new AppError({ message: "Not found", statusCode: HttpStatusCode.NOT_FOUND });
    await Bluebird.map(result.data, (item) => retry(async () => {
      if (checkIfIsGroup(item.remoteJid)) {
        const { data } = await this.client.get(`/group/findGroupInfos/${instanceName}?groupJid=${item.remoteJid}`, {
          headers: {
            Authorization: `Bearer ${session.token}`
          }
        });
        await this.resourcesRepository.saveChat({
          isGroup: true,
          whatsappId: data.id,
          whatsappName: data.subject,
          whatsappSessionId: session.id
        })
      } else {
        const { data } = await this.client.post(`/chat/findContacts/${instanceName}`, {
          where: {
            remoteJid: item.remoteJid
          }
        }, {
          headers: {
            Authorization: `Bearer ${session.token}`
          }
        });
        await this.resourcesRepository.saveChat({
          isGroup: false,
          whatsappId: data[0].remoteJid,
          whatsappName: data[0].pushName,
          whatsappSessionId: session.id
        })
      }
    }, { max_tries: 3, interval: 1000 }), { concurrency: 30 });
    return { message: "Syncronized" }
  }

  async findChats(input: { token: string, instanceName: string }) {
    try {
      const result = await this.client.get(`/chat/findChats/${input.instanceName}`, {
        headers: {
          Authorization: `Bearer ${input.token}`
        }
      })
      return result.data;
    } catch (error: any) {
      logger.error(error.message)
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }

  private async processItem(item: any, token: string, instanceName: string) {
    if (checkIfIsGroup(item.remoteJid)) {
      const { data } = await this.client.get(`/group/findGroupInfos/${instanceName}?groupJid=${item.remoteJid}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data;
    } else {
      const { data } = await this.client.post(`/chat/findContacts/${instanceName}`, {
        where: {
          remoteJid: item.remoteJid
        }
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data;
    }
  }
}