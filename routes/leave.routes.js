import { Router } from "express";
import {
  createLeave,
  getAllLeaves,
  updateLeaveStatus,
} from "../controllers/leave.controller.js";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";

const leaveRouter = Router();

leaveRouter.post("/", createLeave);
leaveRouter.get("/", getAllLeaves);
leaveRouter.patch("/:id", protect, adminOnly, updateLeaveStatus);

export default leaveRouter;
