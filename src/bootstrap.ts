import dotenv from "dotenv";
import http from "http";
import GracefulShutdown from "http-graceful-shutdown";

import { initIO } from "./lib/socket";
import { ExpressAdapter } from "./app/adapters/ExpressAdapter";
import UserController from "./app/controllers/UserController";
import CreateUserService from "./app/services/CreateUserService";
import UserRepository from "./database/prisma-repositories/UserRepository";
import prisma from "./lib/prisma";
import WhatsappController from "./app/controllers/WhatsappController";
import WhatsappSessionsService from "./app/services/WhatsappSessionsService";
import WhatsappRepository from "./database/prisma-repositories/WhatsappRepository";
import ResourcesController from "./app/controllers/ResourcesController";
import SaveManyWhatsappChatService from "./app/services/SaveManyWhatsappChatService";
import ResourcesRepository from "./database/prisma-repositories/ResourcesRepository";
import GetAllChatsService from "./app/services/GetAllChats";
import { CreateSendingListService } from "./app/services/CreateSendingList";
import AuthenticateUserService from "./app/services/AuthenticateUser";
import StripeController from "./app/controllers/StripeController";
import SchedulerController from "./app/controllers/SchedulerController";
import MessageController from "./app/controllers/MessageController";
import CodechatService from "./app/services/CodechatService";
import EvolutionService from "./app/services/EvolutionService";
import DashboardController from "./app/controllers/DashboardController";

const bootstrap = () => {
  dotenv.config();
  const app = new ExpressAdapter();
  const userRepository = new UserRepository(prisma)
  const createUserService = new CreateUserService(userRepository);
  const whatsappRepository = new WhatsappRepository(prisma);
  const whatsappSessionsService = new WhatsappSessionsService(whatsappRepository);
  const resourcesRepository = new ResourcesRepository(prisma);
  const saveManyChatsService = new SaveManyWhatsappChatService(resourcesRepository);
  const getAllChatsService = new GetAllChatsService(resourcesRepository);
  const createSendingList = new CreateSendingListService(resourcesRepository);
  const authenticateUserService = new AuthenticateUserService(userRepository);
  const codechatService = new CodechatService(whatsappRepository, resourcesRepository);
  const evolutionService = new EvolutionService(whatsappRepository, resourcesRepository);

  new UserController(app, createUserService, authenticateUserService);
  new WhatsappController(app, whatsappSessionsService, saveManyChatsService, codechatService, evolutionService);
  new ResourcesController(app, saveManyChatsService, getAllChatsService, createSendingList, evolutionService);
  new StripeController(app);
  new SchedulerController(app);
  new MessageController(app, whatsappSessionsService);
  new DashboardController(app);

  const server = http.createServer(app.getServer());
  
  app.listen(process.env.PORT);
  app.server.keepAliveTimeout = 30 * 1000;
  app.server.headersTimeout = 35 * 1000;
  initIO(server);
  GracefulShutdown(server);
}

export default bootstrap;