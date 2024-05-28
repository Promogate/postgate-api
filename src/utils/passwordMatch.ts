import { compare } from "bcryptjs"

export const passwordMatch = async (password: string, givenPassword: string) => {
  return await compare(givenPassword, password);
}