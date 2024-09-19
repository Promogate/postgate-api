import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { CreateUser } from "../interfaces/CreateUser";
import { AuthenticateUser } from "../interfaces/AuthenticateUser";
import { verifyToken } from "../middleware/verifyToken";
import prisma from "../../lib/prisma";

class UserController {
  constructor(
    httpServer: HttpServer,
    createUserService: CreateUser,
    authenticateUserService: AuthenticateUser
  ) {
    httpServer.on("post", "/user/create", [], async (request: Request, response: Response) => {
      const { token } = await createUserService.execute(request.body);
      return response.status(201).json({ token });
    });
    httpServer.on("post", "/user/login", [], async (request: Request, response: Response) => {
      const body = request.body;
      const { token, user } = await authenticateUserService.execute(body);
      return response.status(200).json({ token, user });
    });
    httpServer.on("get", "/user/who_is", [verifyToken], async (request: Request & { user?: string }, response: Response) => {
      const user = await prisma.userSubscription.findUnique({ where: { userId: request.user } })
      return response.status(200).json(user);
    });
  }
}

export default UserController;