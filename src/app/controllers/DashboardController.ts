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
        const user = request.user as string;
        const pendingAppointments = await prisma.scheduledWorkflow.count({
          where: {
            AND: [
              {
                status: "SCHEDULED"
              },
              {
                userId: user
              }
            ]
          }
        });
        const completedAppointments = await prisma.scheduledWorkflow.count({
          where: {
            AND: [
              {
                status: "COMPLETED"
              },
              {
                userId: user
              }
            ]
          }
        });
        const groups = await prisma.chats.count({
          where: {
            whatsappSession: {
              userId: user
            }
          }
        });
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