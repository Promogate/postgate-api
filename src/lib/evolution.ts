import axios from "axios";
import logger from "../utils/logger";
import AppError from "../helpers/AppError";
import { HttpStatusCode } from "../helpers/HttpStatusCode";

export const codechat = () => {
  if (process.env.WHATSAPP_ENGINE === "evolution" && !process.env.EVOLUTION_URL) {
    logger.error("URL Codechat não configurada");
    throw new AppError({ message: "URL Codechat não foi declarada", statusCode: HttpStatusCode.NOT_FOUND });
  }

  return axios.create({
    baseURL: process.env.EVOLUTION_URL,
    headers: {
      ApiKey: process.env.EVOLUTION_GLOBAL_TOKEN
    },
    timeout: 65 * 1000
  })
}