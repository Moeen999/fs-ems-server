import { Router } from "express";
import {
  createEmployees,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "../controllers/employee.controller.js";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";

const employeeRouter = Router();

employeeRouter.get("/", protect, adminOnly, getEmployees);
employeeRouter.post("/", protect, adminOnly, createEmployees);
employeeRouter.put("/:id", protect, adminOnly, updateEmployee);
employeeRouter.delete("/:id", protect, adminOnly, deleteEmployee);

export default employeeRouter;
