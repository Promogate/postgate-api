import dotenv from "dotenv";
import { ExpressAdapter } from "./app/adapters/ExpressAdapter";
import UserController from "./app/controllers/UserController";
import CreateUserService from "./app/services/CreateUserService";
import UserRepository from "./database/repositories/UserRepository";
import prisma from "./lib/prisma";

dotenv.config();
const app = new ExpressAdapter();
const userRepository = new UserRepository(prisma)
const createUserService = new CreateUserService(userRepository);

new UserController(app, createUserService);

export default app;