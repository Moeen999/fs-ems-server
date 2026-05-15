import { Router } from "express";
import {
  changePassword,
  getSession,
  login,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/session", protect, getSession);
authRouter.put("/change-password", protect, changePassword);

export default authRouter;
