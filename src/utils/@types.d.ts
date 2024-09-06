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
    mediatype: string;
    caption: string;
    media: string;
  }
}

export type EvolutionMediaMessage = {
  sessionId: string;
  number: string;
  mediaMessage: {
    mediatype: string;
    caption: string;
    media: string;
    mentionsEveryOne?: string;
  }
}

export type EvolutionTextMessage = {
  sessionId: string;
  number: string;
  text?: string;
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
}

export type RequestTextMessage = {
  number: string;
  message: {
    text: string;
    linkPreview?: boolean;
    mentionsEveryOne?: boolean;
    delay?: number;
  }
}

export type EvolutionInstance = {
  id: string;
  name: string;
  connectionStatus: string | null;
  ownerJid: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
  integration: string;
  number: string | null;
  businessId: string | null;
  token: string;
  clientName: string;
  disconnectionReasonCode: string | null;
  disconnectionObject: string | null;
  disconnectionAt: string | null;
  createdAt: string;
  updatedAt: string;
  Chatwoot: string | null;
  Proxy: string | null;
  Rabbitmq: string | null;
  Sqs: string | null;
  Websocket: string | null;
  Setting: {
    id: string;
    rejectCall: boolean;
    msgCall: string;
    groupsIgnore: boolean;
    alwaysOnline: boolean;
    readMessages: boolean;
    readStatus: boolean;
    syncFullHistory: boolean;
    createdAt: string;
    updatedAt: string;
    instanceId: string;
  },
  _count: { Message: number, Contact: number, Chat: number }
}

export type EvoltutionFetchInstancesResponse = EvolutionInstance[];

export type EvolutionInstanceConnectResponse = {
  pairingCode: string;
  code: string;
  count: number;
}

export type EvolutionIsInstanceConnectedResponse = {
  instance: {
    instanceName: string;
    state: string;
  }
}

export type EvolutionGroup = {
  id: string;
  subject: string;
  subjectOwner: string;
  subjectTime: number;
  pictureUrl: string | null;
  size: number;
  creation: number;
  owner: string;
  desc: string;
  descId: string;
  restrict: boolean;
  announce: boolean;
}