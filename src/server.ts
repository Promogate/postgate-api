import GracefulShutdown from "http-graceful-shutdown";

import app from "./app";
import logger from "./utils/logger";
import { initIO } from "./lib/socket";

const server = app.listen(process.env.PORT, () => logger.info(`Server running on port: ${process.env.PORT}`));
initIO(server);
GracefulShutdown(server);