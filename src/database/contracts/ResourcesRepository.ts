import { Chats } from "@prisma/client";

type Chat ={
  whatsappId: string;
  whatsappName: string;
  whatsappSessionId: string;
  isGroup: boolean
}

export interface SaveManyChats {
  saveMany(input: SaveManyChats.Input): Promise<void>
}

export namespace SaveManyChats {
  export type Input = Chat[];
}

export interface GetAllChatsRespository {
  getAllChats(input: GetAllChatsRespository.Input): Promise<GetAllChatsRespository.Output>
}

export namespace GetAllChatsRespository {
  export type Input = {
    sessionId: string;
  }
  export type Output = Chats[]
}

export interface SaveSendingList {
  saveSendingList(input: SaveSendingList.Input): Promise<SaveSendingList.Output>;
}

export namespace SaveSendingList {
  export type Input = {
    userId: string;
    name: string;
    list?: string;
  };
  export type Output = void;
}