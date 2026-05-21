// Create payslip

import PaySlip from "../models/PaySlip.js";
import Employee from "../models/Employee.js";

// POST /api/payslips
export const createPayslip = async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions } =
      req.body;
    if (!employeeId || !month || !year || !basicSalary) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const netSalary =
      Number(basicSalary) + Number(allowances || 0) - Number(deductions || 0);

    const payslip = await PaySlip.create({
      employeeId,
      month: Number(month),
      year: Number(year),
      basicSalary: Number(basicSalary),
      allowances: Number(allowances || 0),
      deductions: Number(deductions || 0),
      netSalary,
    });
    res.status(201).json({ success: true, data: payslip });
  } catch (error) {
    return res.status(500).json({ message: "Error creating payslip", error });
  }
};

// Get payslips
// GET /api/payslips
export const getPayslips = async (req, res) => {
  try {
    const session = req.session;
    const isAdmin = session.role === "ADMIN";
    if (isAdmin) {
      const payslips = await PaySlip.find()
        .populate("employeeId")
        .sort({ createdAt: -1 });
      const data = payslips.map((p) => {
        const obj = p.toObject();
        return {
          ...obj,
          id: obj._id.toString(),
          employee: obj.employeeId,
          employeeId: obj.employeeId?._id?.toString(),
        };
      });
      return res.status(200).json({ success: true, data });
    } else {
      const employee = await Employee.findOne({ userId: session.id });
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const payslips = await PaySlip.find({ employeeId: employee._id }).sort({
        createdAt: -1,
      });
      return res.status(200).json({ success: true, data: payslips });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error fetching payslips", error });
  }
};

// Get payslip by ID
// GET /api/payslips/:id
export const getPayslipById = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const payslip = await PaySlip.findById(id).populate("employeeId").lean();
    console.log(payslip)
    if (!payslip) {
      return res.status(404).json({ message: "Payslip not found" });
    }
    const result = {
      ...payslip,
      id: payslip._id.toString(),
      employee: payslip.employeeId,
    };
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching payslip", error });
  }
};
