import Employee from "../models/Employee.js";
import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";

// Check In/Out for employee
// POST /api/attendance/checkin/checkout
export const checkInCheckOut = async (req, res) => {
  try {
    const session = req.session;
    const employee = await Employee.findOne({ userId: session.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    if (employee.isDeleted) {
      return res.status(403).json({
        error: "Not active account found. You cannot perform this action.",
      });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to the start of the day

    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    const now = new Date();
    if (!existingAttendance) {
      const isLate = now.getHours() > 9 && now.getMinutes() > 0; // Assuming 9:00 AM is the check-in time
      const attendance = await Attendance.create({
        employeeId: employee._id,
        date: today,
        checkIn: now,
        status: isLate ? "LATE" : "PRESENT",
      });

      return res.json({
        success: true,
        type: "CHECK_IN",
        message: "Checked In",
        data: attendance,
      });
    } else if (!existingAttendance.checkOut) {
      const checkInTime = new Date(existingAttendance.checkIn).getTime();
      const diffMs = now.getTime() - checkInTime;
      const diffHrs = diffMs / (1000 * 60 * 60);
      existingAttendance.checkOut = now;
      //   compute working hours and day type
      const workingHours = parseFloat(diffHrs.toFixed(2));
      let daytype = "Half Day";
      if (workingHours >= 8) daytype = "Full Day";
      else if (workingHours >= 6) daytype = "Three Quarter Day";
      else if (workingHours >= 4) daytype = "Half Day";
      else daytype = "Short Day";

      existingAttendance.workingHours = workingHours;
      existingAttendance.daytype = daytype;
      await existingAttendance.save();

      // Trigger inngest event on checkout (not checkin)
      await inngest.send({
        name: "employee/check-out",
        data: {
          employeeId: employee._id,
          attendanceId: existingAttendance._id,
        },
      });

      return res.json({
        success: true,
        type: "CHECK_OUT",
        message: "Checked Out",
        data: existingAttendance,
      });
    } else {
      return res.json({
        success: true,
        message: "Already checked out for today",
        data: existingAttendance,
      });
    }
  } catch (error) {
    console.error("Attendance Error: ", error);
    res.status(500).json({ error: "Error occurred while checking in/out" });
  }
};

// Get attendance for employee
// GET /api/attendance
export const getMyAttendance = async (req, res) => {
  try {
    const session = req.session;
    const employee = await Employee.findOne({ userId: session.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const limit = parseInt(req.query.limit) || 30;
    const histroy = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1 })
      .limit(limit);
    return res.json({
      success: true,
      data: histroy,
      employee: { isDeleted: employee.isDeleted },
    });
  } catch (error) {
    console.error("Attendance Error: ", error);
    res.status(500).json({ error: "Error occurred while fetching attendance" });
  }
};
