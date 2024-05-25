import dotenv from "dotenv";
import { ExpressAdapter } from "./app/adapters/ExpressAdapter";
import UserController from "./app/controllers/UserController";

dotenv.config();
const app = new ExpressAdapter();
new UserController(app);

export default app;