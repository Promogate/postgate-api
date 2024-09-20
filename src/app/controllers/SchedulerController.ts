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
        const authToken = request.headers.authorization;
        const userId = request.user;
        const body = request.body as { scheduleTime: string, chosenList: string; chosenWorkflow: string };
        const [listId, whatsappSessionId] = body.chosenList.split("_");
        try {
          const savedScheduledWorkflow = await prisma.scheduledWorkflow.create({
            data: {
              startTime: body.scheduleTime,
              sendingListId: listId,
              userId: userId,
              workflowId: body.chosenWorkflow,
              whatsappSessionId
            }
          });
          const foundSendingList = await prisma.sendingList.findUnique({
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
          if (!foundSendingList || !workflow) {
            return response.status(HttpStatusCode.BAD_REQUEST).send("Some missing properties");
          }
          if (foundSendingList.list === null || workflow.nodes === null) {
            return response.status(HttpStatusCode.BAD_REQUEST).send("Some missing properties");
          }
          const parsedSendingList = JSON.parse(foundSendingList.list);
          const parsedMessages = JSON.parse(workflow.nodes);
          await n8n.post(buildN8nUrl("/schedule"), {
            sendingList: parsedSendingList,
            messages: parsedMessages,
            startTime: savedScheduledWorkflow.startTime,
            whatsappSessionId,
            token: foundSendingList.whatsappSession?.token,
            schedulingId: savedScheduledWorkflow.id,
            authToken
          });
          return response.status(HttpStatusCode.CREATED).send("Agendamento");
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send(error.message);
        }
      });
    httpServer.on("post", "/scheduler/instant_message/:whatsappSessionId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const authToken = request.headers.authorization;
        const { whatsappSessionId } = request.params as { whatsappSessionId: string; };
        if (!whatsappSessionId) return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send("Missing Instance ID");
        const body = request.body as {
          groups: {
            id: string;
            whatsappId: string;
            whatsappName: string;
            isGroup: boolean;
            whatsappSessionId: string;
          }[];
          messages: {
            label: string;
            message: string;
            image?: string;
          };
        };
        try {
          await n8n.post(buildN8nUrl("/instant_message"), {
            sendingList: body.groups,
            messages: [body.messages],
            whatsappSessionId: whatsappSessionId,
            authToken
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
            },
            include: {
              sendingList: {
                select: {
                  name: true
                }
              },
              workflow: {
                select: {
                  title: true
                }
              }
            }
          });
          return response.json(result).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error);
          return response.status(HttpStatusCode.BAD_REQUEST).send(error.message);
        }
      });

    httpServer.on("post", "/scheduler/n8n/webhook", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const body = request.body as { event: string, data: { status: string, schedulingId: string } };
        if (body.event === "update.scheduling") {
          try {
            await prisma.scheduledWorkflow.update({
              where: { id: body.data.schedulingId },
              data: { status: body.data.status }
            })
            return response.status(HttpStatusCode.OK).send();
          } catch (error: any) {
            logger.error(error);
            return response.status(HttpStatusCode.BAD_REQUEST).send(error.message);
          }
        }
        return response.status(HttpStatusCode.OK).send();
      });
  }
}