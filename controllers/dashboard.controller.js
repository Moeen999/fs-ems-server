import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { DEPARTMENTS } from "../constants/departments.js";
import Payslip from "../models/PaySlip.js";

// GET dashboard for admin and employee
//  GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const session = req.session;
    if (session.role === "ADMIN") {
      const [totalEmployees, todayAttendance, pendingLeaves] =
        await Promise.all([
          Employee.countDocuments({ isDeleted: { $ne: true } }),
          Attendance.countDocuments({
            date: {
              $gte: new Date().setHours(0, 0, 0, 0),
              $lte: new Date().setHours(24, 0, 0, 0),
            },
          }),
          LeaveApplication.countDocuments({ status: "PENDING" }),
        ]);
      return res.json({
        role: "ADMIN",
        totalEmployees,
        totalDepartments: DEPARTMENTS.length,
        todayAttendance,
        pendingLeaves,
      });
    } else {
      const employee = await Employee.findOne({
        userId: session.id,
      }).lean();
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const today = new Date();
      const [currentMonthAttendance, pendingLeaves, latestPayslip] =
        await Promise.all([
          Attendance.countDocuments({
            employeeId: employee._id,
            date: {
              $gte: new Date(today.getFullYear(), today.getMonth(), 1),
              $lte: new Date(today.getFullYear(), today.getMonth() + 1, 0), // +1 ka matlab next month ka 0th day yani current month ka last day
            },
          }),
          LeaveApplication.countDocuments({
            employeeId: employee._id,
            status: "PENDING",
          }),
          Payslip.findOne({
            employeeId: employee._id,
          })
            .sort({ createdAt: -1 })
            .lean(), // sort main -1 aur lean ka matlab hai ki latest payslip mile aur usko plain JavaScript object me convert kar de respectively
        ]);
      return res.json({
        role: "EMPLOYEE",
        employee: { ...employee, id: employee._id.toString() },
        currentMonthAttendance,
        pendingLeaves,
        latestPayslip: latestPayslip
          ? { ...latestPayslip, id: latestPayslip._id.toString() }
          : null,
      });
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
