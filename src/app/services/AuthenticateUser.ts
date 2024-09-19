import { sign } from "jsonwebtoken";
import { FindUserByEmailRepository } from "../../database/contracts/UserRepository";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import logger from "../../utils/logger";
import { passwordMatch } from "../../utils/passwordMatch";
import { AuthenticateUser } from "../interfaces/AuthenticateUser";

export default class AuthenticateUserService implements AuthenticateUser {
  constructor(readonly userRepository: FindUserByEmailRepository) { }

  async execute(input: AuthenticateUser.Input): Promise<AuthenticateUser.Ouput> {
    try {
      const user = await this.userRepository.findUserByEmail({ email: input.email });
      if (!user) {
        throw new AppError({ message: "Usuário ou senha incorretos. Tente novamente.", statusCode: HttpStatusCode.UNAUTHORIZED })
      }
      if (!passwordMatch(user.password, input.password)) {
        throw new AppError({ message: "Usuário ou senha incorretos. Tente novamente.", statusCode: HttpStatusCode.UNAUTHORIZED })
      }
      const token = sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: "1d" });
      return {
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          userSubscription: user.userSubscription
        }
      }
    } catch (error: any) {
      logger.info(`[AuthenticateUserService] - ${error.message}`);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }
}