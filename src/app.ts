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

dotenv.config();
const app = new ExpressAdapter();
const userRepository = new UserRepository(prisma)
const createUserService = new CreateUserService(userRepository);
const whatsappRepository = new WhatsappRepository(prisma);
const whatsappSessionsService = new WhatsappSessionsService(whatsappRepository);
const resourcesRepository = new ResourcesRepository(prisma);
const saveManyChatsService = new SaveManyWhatsappChatService(resourcesRepository);
const getAllChatsService = new GetAllChatsService(resourcesRepository);

new UserController(app, createUserService);
new WhatsappController(app, whatsappSessionsService);
new ResourcesController(app, saveManyChatsService, getAllChatsService);

export default app;