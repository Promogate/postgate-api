import { Client } from "whatsapp-web.js";
import { WASocket } from "@whiskeysockets/baileys";

export interface Session extends Client {
  id?: string | number;
}

export interface BaileysSession extends WASocket {
  id?: string;
}

export type Plans = Record<string, { name: string; description: string; amount: number; level: string }>