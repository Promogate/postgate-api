import { WhatsappSession } from "@prisma/client";
import { Session } from "../../utils/@types";

export interface CountActiveSessions {
  countActiveSessions(): Promise<CountActiveSessions.Output>;
}

export namespace CountActiveSessions {
  export type Output = {
    activeSessions: number
  }
}

export interface CreateSession {
  createSession(input: CreateSession.Input): Promise<CreateSession.Output>;
}

export namespace CreateSession {
  export type Input = {
    userId: string;
  }
  export type Output = {
    id: string
  }
}

export interface GetSession {
  getSession(input: GetSession.Input): Promise<GetSession.Output>;
}

export namespace GetSession {
  export type Input = {
    id: string;
  }
  export type Output = WhatsappSession | null;
}

export interface UpdateSession {
  update(input: UpdateSession.Input): Promise<void>
}

export namespace UpdateSession {
  export type Input = {
    id: string;
    session?: string;
    status?: string;
    qr?: string;
    retries?: number;
  }
}

export interface GetAllSessions {
  getAllSessions(): Promise<GetAllSessions.Output>;
}

export namespace GetAllSessions {
  export type Output = WhatsappSession[];
}