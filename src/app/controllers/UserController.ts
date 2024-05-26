import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { CreateUser } from "../interfaces/CreateUser";

class UserController {
  constructor(
    httpServer: HttpServer,
    createUserService: CreateUser
  ) {
    httpServer.on("post", "/user/create", [], async (request: Request, response: Response) => {
      await createUserService.execute(request.body);
      return response.status(201).json({ message: "ok" });
    });
  }
}

export default UserController;