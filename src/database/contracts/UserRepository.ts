import { User } from "@prisma/client";

export interface CreateUserRepository {
  create(input: CreateUserRepository.Input): Promise<CreateUserRepository.Output>;
}

export namespace CreateUserRepository {
  export type Input = {
    email: string;
    password: string;
    username?: string;
  };
  export type Output = User;
}