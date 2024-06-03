export interface AuthenticateUser {
  execute(input: AuthenticateUser.Input): Promise<AuthenticateUser.Ouput>
}

export namespace AuthenticateUser {
  export type Input = {
    email: string;
    password: string;
  }
  export type Ouput = {
    token: string;
    user: {
      id: string;
      email: string;
      username: string | undefined | null;
    }
  }
}