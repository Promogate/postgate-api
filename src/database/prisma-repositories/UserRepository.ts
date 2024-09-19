import { PrismaClient } from "@prisma/client";
import { CreateUserRepository, FindUserByEmailRepository } from "../contracts/UserRepository";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";

class UserRepository implements CreateUserRepository, FindUserByEmailRepository {
  constructor(readonly database: PrismaClient) { }

  async create(input: CreateUserRepository.Input): Promise<CreateUserRepository.Output> {
    try {
      const user = await this.database.user.create({
        data: {
          email: input.email,
          password: input.password,
          username: input.username,
          userSubscription: {
            create: {
              subscriptionLevel: "FREE"
            }
          }
        }
      });
      return user;
    } catch (error: any) {
      logger.error(error.message);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.INTERNAL_SERVER });
    }
  }

  async findUserByEmail(input: FindUserByEmailRepository.Input): Promise<FindUserByEmailRepository.Output> {
    try {
      const user = await this.database.user.findUnique({
        where: {
          email: input.email
        },
        include: {
          userSubscription: true,
        }
      });
      return user;
    } catch (error: any) {
      logger.error(error.message);
      throw new AppError({ message: error.message, statusCode: HttpStatusCode.INTERNAL_SERVER });
    }
  }
}

export default UserRepository;