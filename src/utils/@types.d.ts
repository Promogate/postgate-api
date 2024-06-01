import { Client } from "whatsapp-web.js";

export interface Session extends Client {
  id?: string;
}

export type Plans = Record<string, { name: string; description: string; amount: number; level: string }>