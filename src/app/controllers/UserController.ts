import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";

class UserController {
  constructor(httpServer: HttpServer) {
    httpServer.on("post", "/user/create", [], async (request: Request, response: Response) => {
      return response.status(201).json({ message: "ok" });
    });
  }
}

export default UserController;