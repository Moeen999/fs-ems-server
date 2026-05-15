import { Router } from "express";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";
import {
  createPayslip,
  getPayslipById,
  getPayslips,
} from "../controllers/payslip.controller.js";

const payslipRouter = Router();

payslipRouter.post("/", protect, adminOnly, createPayslip);
payslipRouter.get("/", protect, getPayslips);
payslipRouter.get("/:id", protect, getPayslipById);

export default payslipRouter;
