import { Server } from "http";
import { Server as SocketIO } from "socket.io";
import logger from "../utils/logger";
import AppError from "../helpers/AppError";

let io: SocketIO;

export const initIO = (httpServer: Server) => {
  io = new SocketIO(httpServer);

  io.on("connection", socket => {
    logger.info("Client Connected");
    return socket;
  });

  return io;
}

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO não inicializado");
  }
  return io;
}