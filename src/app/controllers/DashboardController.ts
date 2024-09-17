import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { verifyToken } from "../middleware/verifyToken";
import prisma from "../../lib/prisma";

export default class DashboardController {
  constructor(
    readonly httpServer: HttpServer,
  ) {
    httpServer.on(
      "get",
      "/dashboard",
      [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const pendingAppointments = await prisma.scheduledWorkflow.count({ where: { status: "SCHEDULED" } });
        const completedAppointments = await prisma.scheduledWorkflow.count({ where: { status: "COMPLETED" } });
        const groups = await prisma.chats.count();
        return response.json({
          data: {
            pendingAppointments,
            completedAppointments,
            groupsCount: groups
          }
        }).status(200);
      });
  }
}