import { AxiosInstance, AxiosResponse } from "axios";
import { CreateSession, UpdateSession } from "../../database/contracts/WhatsappRepository";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import logger from "../../utils/logger";
import { SaveChat } from "../../database/contracts/ResourcesRepository";
import checkIfIsGroup from "../../helpers/CheckIfIsAGroup";
import prisma from "../../lib/prisma";
import Bluebird from "bluebird";
import retry from "bluebird-retry";
import { Chat, EvolutionTextMessage, MediaMessage } from "../../utils/@types";
import { whatsappClient } from "../../lib/whatsapp";

export default class CodechatService {
  client: AxiosInstance

  constructor(
    readonly whatsappRepository: CreateSession & UpdateSession,
    readonly resourcesRepository: SaveChat
  ) {
    this.client = whatsappClient();
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

  async getChats(input: { token: string, instanceName: string }): Promise<any> {
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
    return { chats: JSON.stringify(result.data), sessionToken: session.token }
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

  async processItem(input: { item: any, token: string, instanceName: string }) {
    if (checkIfIsGroup(input.item.remoteJid)) {
      const { data } = await this.client.get(`/group/findGroupInfos/${input.instanceName}?groupJid=${input.item.remoteJid}`, {
        headers: {
          Authorization: `Bearer ${input.token}`
        }
      });
      await this.resourcesRepository.saveChat({
        isGroup: true,
        whatsappId: data.id,
        whatsappName: data.pushName,
        whatsappSessionId: input.instanceName
      })
    } else {
      const { data } = await this.client.post(`/chat/findContacts/${input.instanceName}`, {
        where: {
          remoteJid: input.item.remoteJid
        }
      }, {
        headers: {
          Authorization: `Bearer ${input.token}`
        }
      });
      await this.resourcesRepository.saveChat({
        isGroup: false,
        whatsappId: data[0].remoteJid,
        whatsappName: data[0].pushName,
        whatsappSessionId: input.instanceName
      })
      return data;
    }
  }

  async processItems(input: { chats: string, token: string, instanceName: string }) {
    const chats = JSON.parse(input.chats) as Chat[];
    await Bluebird.each(chats, (chat) => retry(async () => {
      const chatAlreadySync = await prisma.chats.findFirst({
        where: {
          whatsappId: chat.remoteJid
        }
      })
      if (chatAlreadySync) return;
      try {
        if (checkIfIsGroup(chat.remoteJid)) {
          retry(async () => {
            try {
              const { data, status } = await this.client.get(`/group/findGroupInfos/${input.instanceName}?groupJid=${chat.remoteJid}`, {
                headers: {
                  Authorization: `Bearer ${input.token}`
                },
                timeout: 900
              });
              if (status !== 200) return;
              await this.resourcesRepository.saveChat({
                isGroup: true,
                whatsappId: data.id,
                whatsappName: data.subject,
                whatsappSessionId: input.instanceName
              })
            } catch (error: any) {
              logger.error(error.message);
            }
          }, { max_tries: 10, timeout: 90 * 1000 });
        } else {
          const { data, status } = await this.client.post(`/chat/findContacts/${input.instanceName}`, {
            where: {
              remoteJid: chat.remoteJid
            }
          }, {
            headers: {
              Authorization: `Bearer ${input.token}`
            },
            timeout: 900
          });
          if (status !== 200) return;
          await this.resourcesRepository.saveChat({
            isGroup: false,
            whatsappId: data[0].remoteJid,
            whatsappName: data[0].pushName,
            whatsappSessionId: input.instanceName
          })
        }
      } catch (error: any) {
        logger.error(error.message);
      }
    }, { max_tries: 3, interval: 1000 }));
  }

  async sendMediaMessage(input: MediaMessage) {
    try {
      const whatappSession = await prisma.whatsappSession.findUnique({ where: { id: input.sessionId } });
      if (!whatappSession) throw new Error("Whatsapp instance not found");
      const { data, status } = await this.client.post(`/message/sendMedia/${input.sessionId}`, input, {
        headers: {
          Authorization: `Bearer ${whatappSession.token}`
        }
      })
      return data;
    } catch (error: any) {
      logger.error(`[Codechat Service] | ${error.message}`);
    }
  }

  async sendTextMessage(input: EvolutionTextMessage) {
    try {
      const whatappSession = await prisma.whatsappSession.findUnique({ where: { id: input.sessionId } });
      if (!whatappSession) throw new Error("Whatsapp instance not found");
      const { data, status } = await this.client.post(`/message/sendText/${input.sessionId}`, input);
      return data;
    } catch (error: any) {
      logger.error(`[Evolution Service] | ${error.message}`);
    }
  }
}