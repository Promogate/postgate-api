import { User } from "@prisma/client";

export interface CreateUser {
  execute(input: CreateUser.Input): Promise<CreateUser.Output>
}

export namespace CreateUser {
  export type Input = {
    email: string;
    password: string;
    username: string;
  };
  export type Output ={
    token: string;
    user: User
  };
}