import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";

export class ViewController {
  constructor(
    httpServer: HttpServer
  ) {
    httpServer.on("get", "/", [], async (request: Request, response: Response) => {
      response.render("home", { title: "Home" });
    })
  }
}