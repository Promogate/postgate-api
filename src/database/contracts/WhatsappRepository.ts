export interface CountActiveSessions {
  countActiveSessions(): Promise<CountActiveSessions.Output>;
}

export namespace CountActiveSessions {
  export type Output = {
    activeSessions: number
  }
}