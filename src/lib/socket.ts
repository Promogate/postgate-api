import { Server } from "http";
import { Server as SocketIO } from "socket.io";
import logger from "../utils/logger";
import AppError from "../helpers/AppError";
import { HttpStatusCode } from "../helpers/HttpStatusCode";

let io: SocketIO;

export const initIO = (httpServer: Server) => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: "http://localhost:3000", // Replace with your frontend URL
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", socket => {
    logger.info("Client Connected");
    return socket;
  });

  return io;
}

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError({ message: "Socket IO não inicializado", statusCode: HttpStatusCode.BAD_REQUEST });
  }
  return io;
}