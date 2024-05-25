import GracefulShutdown from "http-graceful-shutdown";

import app from "./app";
import { initIO } from "./lib/socket";

const server = app.listen(process.env.PORT);
initIO(server);
GracefulShutdown(server);