import { Request, Response } from "express";
import { HttpServer } from "../interfaces/HttpServer";
import { verifyToken } from "../middleware/verifyToken";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import { SaveManyWhatsappChats } from "../interfaces/SaveManyWhatsappChats";
import logger from "../../utils/logger";
import { GetAllChats } from "../interfaces/GetAllChats";
import { CreateSendingList } from "../interfaces/CreateSendingList";
import prisma from "../../lib/prisma";
import { Group } from "../../utils/@types";

export default class ResourcesController {
  constructor(
    httpServer: HttpServer,
    readonly saveManyChatsService: SaveManyWhatsappChats,
    readonly getAllChatsService: GetAllChats,
    readonly createSendingList: CreateSendingList
  ) {
    httpServer.on("post", "/resources/chats/save/:sessionId", [verifyToken],
      async (request: Request, response: Response) => {
        const sessionId = request.params.sessionId
        if (!sessionId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
        }
        const body = request.body;
        try {
          await saveManyChatsService.execute({ chats: body, sessionId: sessionId });
          return response.status(HttpStatusCode.CREATED).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("post", "/resources/sending-list/save", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const userId = request.user;
        if (!userId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
        }
        const body = request.body;
        try {
          await createSendingList.execute({
            chats: body.chats,
            name: body.name || crypto.randomUUID(),
            userId: userId
          });
          return response.status(HttpStatusCode.CREATED).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("get", "/resources/chats/:sessionId", [verifyToken],
      async (request: Request, response: Response) => {
        const sessionId = request.params.sessionId
        if (!sessionId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "Sessin ID is missing!" });
        }
        try {
          const result = await getAllChatsService.execute({ sessionId: sessionId });
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("get", "/resources/sending-lists", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const userId = request.user;
        try {
          const result = await prisma.sendingList.findMany({
            where: { userId: userId }
          })
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      });
    httpServer.on("get", "/resources/sending-lists/:listId", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const { listId } = request.params as { listId: string };
        if (!listId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "List ID is missing!" });
        }
        try {
          const result = await prisma.sendingList.findUnique({
            where: { id: listId }
          })
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      });
    httpServer.on("put", "/resources/sending-lists/:listId", [verifyToken],
      async (request: Request, response: Response) => {
        const body = request.body;
        const { listId } = request.params as { listId: string };
        if (!listId) {
          return response.status(HttpStatusCode.UNPROCESSABLE_ENTITY).send({ message: "List ID is missing!" });
        }
        try {
          await prisma.sendingList.update({
            where: { id: listId },
            data: body
          })
          return response.status(HttpStatusCode.OK).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      });
    httpServer.on("get", "/resources/workflows", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const userId = request.user;
        try {
          const result = await prisma.workflow.findMany({
            where: {
              AND: [
                {
                  userId: userId
                },
                {
                  description: {
                    equals: "workflow"
                  }
                }
              ]
            }
          });
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("get", "/resources/workflows/:workflowId", [verifyToken],
      async (request: Request, response: Response) => {
        const { workflowId } = request.params as { workflowId: string };
        try {
          const result = await prisma.workflow.findUnique({
            where: {
              id: workflowId
            }
          })
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("post", "/resources/workflows", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const userId = request.user;
        const body = request.body;
        try {
          await prisma.workflow.create({
            data: {
              title: body.title,
              description: body.description,
              userId: userId
            }
          })
          return response.status(HttpStatusCode.CREATED).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      });
    httpServer.on("get", "/resources/workflows/:workflowId", [verifyToken],
      async (request: Request, response: Response) => {
        const { workflowId } = request.params as { workflowId: string };
        try {
          const result = await prisma.workflow.findUnique({
            where: {
              id: workflowId
            }
          })
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("put", "/resources/workflows/:workflowId", [verifyToken],
      async (request: Request, response: Response) => {
        const { workflowId } = request.params as { workflowId: string };
        const nodes = JSON.stringify(request.body.nodes);
        const edges = JSON.stringify(request.body.edges);
        try {
          const result = await prisma.workflow.update({
            where: {
              id: workflowId
            }, data: { ...request.body, nodes, edges }
          })
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      });
    httpServer.on("delete", "/resources/workflows/:workflowId", [verifyToken],
      async (request: Request, response: Response) => {
        const { workflowId } = request.params as { workflowId: string };
        const nodes = JSON.stringify(request.body.nodes);
        const edges = JSON.stringify(request.body.edges);
        try {
          const result = await prisma.workflow.delete({
            where: {
              id: workflowId
            }
          });
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      });
    httpServer.on("post", "/resources/messages_lists", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const userId = request.user;
        const body = request.body;
        try {
          await prisma.workflow.create({
            data: {
              title: body.title,
              description: body.description,
              userId: userId
            }
          })
          return response.status(HttpStatusCode.CREATED).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      });
    httpServer.on("get", "/resources/messages_lists", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const userId = request.user;
        try {
          const result = await prisma.workflow.findMany({
            where: {
              AND: [
                {
                  userId: userId
                },
                {
                  description: {
                    equals: "messages_list"
                  }
                }
              ]
            }
          })
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("get", "/resources/messages_lists/:workflowId", [verifyToken],
      async (request: Request, response: Response) => {
        const { workflowId } = request.params as { workflowId: string };
        try {
          const result = await prisma.workflow.findUnique({
            where: {
              id: workflowId
            }
          })
          return response.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("get", "/resources/redirectors", [verifyToken],
      async (request: Request & { user?: string }, response: Response) => {
        const user = request.user;
        try {
          const result = await prisma.redirector.findMany({ where: { userId: user } });
          return response.json(result).status(HttpStatusCode.OK);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("post", "/resources/redirectors", [verifyToken],
      async (request: Request & { user?: string; }, response: Response) => {
        const body = request.body as { title: string; identifier: string; };
        const user = request.user as string;
        try {
          await prisma.redirector.create({
            data: {
              identifier: body.identifier,
              title: body.title,
              userId: user
            }
          })
          return response.status(HttpStatusCode.OK).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("get", "/resources/redirectors/:redirectorId", [verifyToken],
      async (request: Request & { user?: string; }, response: Response) => {
        const params = request.params as { redirectorId: string };
        try {
          const redirector = await prisma.redirector.findUnique({ where: { id: params.redirectorId } })
          return response.status(HttpStatusCode.OK).json(redirector);
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
    httpServer.on("put", "/resources/redirectors/groups/:redirectorId", [verifyToken],
      async (request: Request & { user?: string; }, response: Response) => {
        const params = request.params as { redirectorId: string };
        const body = request.body as { instanceId: string; groups: string };
        try {
          await prisma.redirector.update({
            where: { id: params.redirectorId },
            data: {
              instanceId: body.instanceId,
              groups: body.groups
            }
          })
          return response.status(HttpStatusCode.OK).send();
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      })
  }
}