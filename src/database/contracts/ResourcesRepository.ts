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