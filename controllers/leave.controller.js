import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";

// Create Leave
// POST /api/leaves
export const createLeave = async (req, res) => {
  try {
    const session = req.session;
    const employee = await Employee.findOne({ userId: session.userId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    if (employee.isDeleted) {
      return res.status(400).json({
        message: "Your account is deactivated. You cannot apply for leave.",
      });
    }

    const { type, startDate, endDate, reason } = req.body;
    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (new Date(startDate) <= today || new Date(endDate) <= today) {
      return res.status(400).json({ message: "Leave dates must be in future" });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    const leave = await LeaveApplication.create({
      employeeId: employee._id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: "PENDING",
    });
    return res
      .status(201)
      .json({ success: true, message: "Leave application created", leave });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error creating leave application" });
  }
};

// Get All Leaves
// GET /api/leaves
export const getAllLeaves = async (req, res) => {
  try {
    const session = req.session;
    const isAdmin = session.role === "ADMIN";
    if (isAdmin) {
      const status = req.query.status;
      const filter = status ? { status } : {};
      const leaves = await LeaveApplication.find(filter)
        .populate("employeeId")
        .sort({ createdAt: -1 });
      const data = leaves.map((l) => {
        const obj = l.toObject();
        return {
          ...data,
          id: obj._id.toString(),
          employee: obj.employeeId.name,
          employeeId: obj.employeeId?._id?.toString(),
        };
      });
      return res.status(200).json({ success: true, data });
    } else {
      const employee = await Employee.findOne({
        userId: session.userId,
      }).lean();
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const leaves = await LeaveApplication.find({
        employeeId: employee._id,
      }).sort({ createdAt: -1 });
      res.json({
        success: true,
        data: leaves,
        employee: { ...employee, id: employee._id.toString() },
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error fetching leave applications" });
  }
};

// Update Leave Status
// PUT /api/leaves/:id/status
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const leave = await LeaveApplication.findById(
      req.params.id,
      {
        status,
      },
      { returnDocument: "after" },
    );
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    res.json({ success: true, message: "Leave status updated", data: leave });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating leave status" });
  }
};
