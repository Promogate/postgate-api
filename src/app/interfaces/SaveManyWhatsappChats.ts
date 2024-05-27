import { Chat } from "whatsapp-web.js"

export interface SaveManyWhatsappChats {
  execute(input: SaveManyWhatsappChats.Input): Promise<void>
}

export namespace SaveManyWhatsappChats {
  export type Input = {
    chats: Chat[],
    sessionId: string;
  }
}