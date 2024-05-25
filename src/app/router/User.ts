import { Router } from "express";

const userRouter = Router();

userRouter.post("/create", async (request, response) => {
  return response.status(201).json({ message: "ok" });
});

export default userRouter;