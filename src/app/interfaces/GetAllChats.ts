import { Chats } from "@prisma/client"

export interface GetAllChats {
  execute(input: GetAllChats.Input): Promise<GetAllChats.Output>
}

export namespace GetAllChats {
  export type Input = { sessionId: string; };
  export type Output = Chats[];
}