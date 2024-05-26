import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import logger from "../../utils/logger";

export function verifyToken (req: Request & { user?: string }, res: Response, next: NextFunction) {
  const { authorization } = req.headers;
  if (!authorization) {
    logger.error("Authorization not found");
    return res.status(401).json({ code: "token.invalid", message: "Token não encontrado" });
  }
  
  const [, token] = authorization.split(" ");
  
  if (token === undefined) {
    logger.error("Authorization not undefined");
    return res.status(401).json({ code: "token.invalid", message: "Token não encontrado" });
  }

  try {
    const verified = verify(token, process.env.JWT_SECRET as string) as { id: string };
    req.user = verified.id;

    next();
  } catch {
    return res.status(401).json({ code: "token.invalid", message: "Token inválido" });
  }
}