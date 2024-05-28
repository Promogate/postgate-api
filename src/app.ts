import dotenv from "dotenv";
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

new UserController(app, createUserService, authenticateUserService);
new WhatsappController(app, whatsappSessionsService);
new ResourcesController(app, saveManyChatsService, getAllChatsService, createSendingList);

export default app;