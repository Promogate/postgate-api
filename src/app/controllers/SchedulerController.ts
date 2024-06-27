import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { verifyToken } from "../middleware/verifyToken";
import logger from "../../utils/logger";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import prisma from "../../lib/prisma";
import n8n from "../../lib/n8n";
import { buildN8nUrl } from "../../utils/buildN8nUrl";

export default class SchedulerController {
  constructor(httpServer: HttpServer) {
    httpServer.on("post", "/scheduler/workflows", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const userId = request.user;
        const body = request.body as { scheduleTime: string, chosenList: string; chosenWorkflow: string };
        const [listId, whatsappSessionId] = body.chosenList.split("_");
        try {
          const scheduled = await prisma.scheduledWorkflow.create({
            data: {
              startTime: body.scheduleTime,
              sendingListId: listId,
              userId: userId,
              workflowId: body.chosenWorkflow,
              whatsappSessionId
            }
          });
          const sendingList = await prisma.sendingList.findUnique({
            where: {
              id: listId
            },
            include: {
              whatsappSession: {
                select: {
                  token: true
                }
              }
            }
          });
          const workflow = await prisma.workflow.findUnique({ where: { id: body.chosenWorkflow } });
          if (!sendingList || !workflow) {
            return response.status(HttpStatusCode.BAD_REQUEST).send("Some missing properties");
          }
          if (sendingList.list === null || workflow.nodes === null) {
            return response.status(HttpStatusCode.BAD_REQUEST).send("Some missing properties");
          }
          const parsedSendingList = JSON.parse(sendingList.list);
          const parsedMessages = JSON.parse(workflow.nodes);
          await n8n.post(buildN8nUrl("/schedule"), {
            sendingList: parsedSendingList,
            messages: parsedMessages,
            startTime: scheduled.startTime,
            whatsappSessionId,
            token: sendingList.whatsappSession?.token
          });
          return response.status(HttpStatusCode.CREATED).send("Agendamento");
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send(error.message);
        }
      });

    httpServer.on("get", "/scheduler/agenda", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const user = request.user;
        try {
          const result = await prisma.scheduledWorkflow.findMany({
            where: {
              userId: user
            }
          });
          return response.json(result).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error);
          return response.status(HttpStatusCode.BAD_REQUEST).send(error.message);
        }
      });
  }
}