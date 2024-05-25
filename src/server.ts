import http from "http";

import app from "./app";
import logger from "./utils/logger";

const server = http.createServer(app);
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => logger.info(`Server running on port: ${PORT}`));