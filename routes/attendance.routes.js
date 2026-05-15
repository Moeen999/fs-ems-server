import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  checkInCheckOut,
  getMyAttendance,
} from "../controllers/attendance.controller.js";

const attendanceRouter = Router();

attendanceRouter.post("/", protect, checkInCheckOut);
attendanceRouter.get("/", protect, getMyAttendance);


export default attendanceRouter;