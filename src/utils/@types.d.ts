import { Client } from "whatsapp-web.js";
import { WASocket } from "@whiskeysockets/baileys";

export interface Session extends Client {
  id?: string | number;
}

export interface BaileysSession extends WASocket {
  id?: string;
}

export type Plans = Record<string, { name: string; description: string; amount: number; level: string }>

export type Chat = {
  id: string,
  remoteJid: string,
  createdAt: string,
  updatedAt: string,
  instanceId: string
}

export type MediaMessage = {
  sessionId: string;
  number: string;
  mediaMessage: {
    mediaType: string;
    caption: string;
    media: string;
  }
}