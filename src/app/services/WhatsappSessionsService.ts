import { Client, LocalAuth } from "whatsapp-web.js";
import qrCode from "qrcode-terminal";

import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import { CountActiveSessions, CreateSession, GetAllSessions, GetSession, UpdateSession } from "../../database/contracts/WhatsappRepository";
import { Session } from "../../utils/@types";
import { stringifyCircularJSON } from "../../utils/stringifyCircularJSON";
import { WhatsappSession } from "@prisma/client";

export default class WhatsappSessionsService {
  sessions: Session[] = []

  constructor(
    readonly whatsappRepository:
      CountActiveSessions &
      CreateSession &
      GetSession &
      UpdateSession &
      GetAllSessions
  ) {
    this.resumeAllSesssions();
  }

  async countActiveSessions(): Promise<{ activeSessions: number }> {
    try {
      const result = await this.whatsappRepository.countActiveSessions();
      return result;
    } catch (error: any) {
      logger.error(`[WhatsappSessionsService|countActiveSessions]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }

  async createSession(input: CreateSession.Input) {
    try {
      const { id } = await this.whatsappRepository.createSession({
        userId: input.userId,
        name: input.name,
        description: input.description
      });
      const whatsapp: Session = new Client({
        authStrategy: new LocalAuth({ clientId: id }),
        webVersionCache: {
          type: "remote",
          remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu"
          ],
          executablePath: "/usr/bin/chromium-browser"
        }
      });

      whatsapp.initialize();

      whatsapp.on("qr", async (qr) => {
        logger.info(`Session: ${id}`);
        qrCode.generate(qr, { small: true });
        await this.whatsappRepository.update({ id: id, qr: qr, status: "qrcode", retries: 0 });
        const sessionIndex = this.sessions.findIndex(session => session.id === id);
        if (sessionIndex === -1) {
          whatsapp.id = id;
          this.sessions.push(whatsapp);
        }
      });

      whatsapp.on("authenticated", async (session) => {
        logger.info(`Session: ${id} Authenticated`);
      });

      whatsapp.on("auth_failure", async (message) => {
        logger.error(`Session: ${id} Authentication failure, reason: ${message}`);
        const session = await this.whatsappRepository.getSession({ id: id });
        if (!session || !session.retries) throw new AppError({ message: "", statusCode: HttpStatusCode.BAD_REQUEST });
        if (session.retries > 1) {
          await this.whatsappRepository.update({ id: id, status: "", retries: 0 });
        }
        const retries = session.retries;
        await this.whatsappRepository.update({ id: id, retries: retries + 1 });
        throw new AppError({ message: message, statusCode: HttpStatusCode.BAD_REQUEST });
      });

      whatsapp.on("ready", async () => {
        logger.info(`Session: ${id} Ready`);
        await this.whatsappRepository.update({
          id: id,
          status: "CONNECTED",
          qr: "",
          retries: 0,
          session: stringifyCircularJSON(whatsapp)
        });
        const sessionIndex = this.sessions.findIndex(session => session.id === id);
        if (sessionIndex === -1) {
          whatsapp.id = id;
          this.sessions.push(whatsapp);
        }
        whatsapp.sendPresenceAvailable();
      });
    } catch (error: any) {
      logger.error(`[WhatsappSessionsService|startSession]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }

  async resumeAllSesssions() {
    logger.info("Resuming all sessions");
    const sessions = await this.whatsappRepository.getAllSessions();
    if (sessions.length === 0) {
      logger.info("No active sessions to be resumed");
    }
    if (sessions.length > 0) {
      sessions.forEach(session => {
        this.startWhatsappSession(session);
      });
    }
  }

  async startWhatsappSession(whatsappSession: WhatsappSession) {
    try {
      const whatsapp: Session = new Client({
        authStrategy: new LocalAuth({ clientId: whatsappSession.id }),
        webVersionCache: {
          type: "remote",
          remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu"
          ],
          executablePath: "/usr/bin/chromium-browser"
        }
      });

      whatsapp.initialize();

      whatsapp.on("qr", async (qr) => {
        logger.info(`Session: ${whatsappSession.id}`);
        qrCode.generate(qr, { small: true });
        await this.whatsappRepository.update({ id: whatsappSession.id, qr: qr, status: "qrcode", retries: 0 });
        const sessionIndex = this.sessions.findIndex(session => session.id === session.id);
        if (sessionIndex === -1) {
          whatsapp.id = whatsappSession.id;
          this.sessions.push(whatsapp);
        }
      });

      whatsapp.on("authenticated", async (session) => {
        logger.info(`Session: ${whatsappSession.id} Authenticated`);
      });

      whatsapp.on("auth_failure", async (message) => {
        logger.error(`Session: ${whatsappSession.id} Authentication failure, reason: ${message}`);
        const session = await this.whatsappRepository.getSession({ id: whatsappSession.id });
        if (!session || !session.retries) throw new AppError({ message: "", statusCode: HttpStatusCode.BAD_REQUEST });
        if (session.retries > 1) {
          await this.whatsappRepository.update({ id: whatsappSession.id, status: "", retries: 0 });
        }
        const retries = session.retries;
        await this.whatsappRepository.update({ id: whatsappSession.id, retries: retries + 1 });
        throw new AppError({ message: message, statusCode: HttpStatusCode.BAD_REQUEST });
      });

      whatsapp.on("ready", async () => {
        logger.info(`Session: ${whatsappSession.id} Ready`);
        await this.whatsappRepository.update({
          id: whatsappSession.id,
          status: "CONNECTED",
          qr: "",
          retries: 0,
          session: stringifyCircularJSON(whatsapp)
        });
        const sessionIndex = this.sessions.findIndex(session => session.id === whatsappSession.id);
        if (sessionIndex === -1) {
          whatsapp.id = whatsappSession.id;
          this.sessions.push(whatsapp);
        }
        whatsapp.sendPresenceAvailable();
      });
    } catch (error: any) {
      logger.error(`[WhatsappSessionsService|startSession]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }

  getSession(sessionId: string) {
    return this.sessions.find(session => session.id === sessionId);
  }

  async getChats(sessionId: string) {
    const session = this.getSession(sessionId);
    if (!session) throw new AppError({
      message: "Whatsapp session not found or is restarting. Verify connection status or try again later",
      statusCode: HttpStatusCode.NOT_FOUND
    })
    try {
      const chats = await session.getChats();
      return chats;
    } catch (error: any) {
      logger.error(`[WhatsappSessionsService|getChats]: ${error.message}`);
      throw new AppError({
        message: error.message,
        statusCode: HttpStatusCode.BAD_REQUEST
      })
    }
  }
}