import { Chats } from "@prisma/client"

export interface CreateSendingList {
  execute(input: CreateSendingList.Input): Promise<CreateSendingList.Output>;
}

export namespace CreateSendingList {
  export type Input = {
    userId: string;
    name: string;
    chats: Chats[];
  }
  export type Output = void;
}