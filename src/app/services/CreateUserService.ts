import { sign } from "jsonwebtoken";
import { genSalt, hash } from "bcryptjs";

import { CreateUser } from "../interfaces/CreateUser";
import { CreateUserRepository } from "../../database/contracts/UserRepository";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import logger from "../../utils/logger";
import { getIO } from "../../lib/socket";

class CreateUserService implements CreateUser {
  constructor(readonly userRepository: CreateUserRepository) { }

  async execute(input: CreateUser.Input): Promise<CreateUser.Output> {
    try {
      const io = getIO();
      const salt = await genSalt(10);
      const encryptedPassword = await hash(input.password, salt);
      const user = await this.userRepository.create({
        email: input.email,
        password: encryptedPassword,
        username: input.username
      });
      const token = sign({ email: user.email }, process.env.JWT_SECRET as string, { expiresIn: "1d" });
      io.emit("user", {
        action: "created",
        token: token,
        email: user.email
      })
      return {
        token: token
      }
    } catch (error: any) {
      logger.error(`[CreateUserService] - ${error.message}`);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
    }
  }
}

export default CreateUserService;