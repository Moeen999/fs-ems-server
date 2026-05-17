import { cron, Inngest } from "inngest";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "fs-ems" });

// auto checkOut function:
const autoCheckout = inngest.createFunction(
  { id: "auto-check-out" },
  { event: "employee/check-out" },
  async ({ event, step }) => {
    const { employeeId, attendanceId } = event.data;
    // Wait for 9 hours
    await step.sleepUntill(
      "wait-for-the-9-hours",
      new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    );
    // get attendance data
    let attendance = await Attendance.findById(attendanceId);
    if (!attendance?.checkOut) {
      // get employee data
      const employee = await Employee.findById(employeeId);

      // Send reminder email

      // After 10 hours mark attendance as checked out with LATE status
      await step.sleepUntill(
        "wait-for-the-1-hour",
        new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
      );

      attendance = await Attendance.findById(attendanceId);
      if (!attendance?.checkOut) {
        attendance.chechOut =
          new Date(attendance.checkIn).getTime() + 4 * 60 * 60 * 1000;
        attendance.workingHours = 4;
        attendance.dayType = "Half Day";
        attendance.status = "LATE";
        await attendance.save();
      }
    }
  },
);

const leaveApplicationReminder = inngest.createFunction(
  { id: "leave-application-reminder" },
  { event: "leave/pending" },

  async ({ event, step }) => {
    const { leaveApplicationId } = event.data;

    // wait for 24 hours
    await step.sleepUntill(
      "wait-for-24-hours",
      new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    );

    // get leave application data
    const leaveApplication =
      await LeaveApplication.findById(leaveApplicationId);
    if (leaveApplication.status === "PENDING") {
      const employee = await Employee.findById(leaveApplication.employeeId);
      // send reminder email to the manager
    }
  },
);

const attendanceReminderCron = inngest.createFunction(
  { id: "attendance-reminder-cron" },
  { cron: "0 0 6 * * *" }, // 06:00 UTC = 11:30 IST

  async ({ step }) => {
    // Step 1: Get today's date range (IST)
    const today = await step.run("get-today-date", async () => {
      const startUTC = new Date(
        new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) +
          "T00:00:00+05:30",
      );
      const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);
      return { startUTC: startUTC.toISOString(), endUTC: endUTC.toISOString() };
    });

    // Step 2: Get all active/non deleted employees
    const activeEmployees = await step.run("get-active-employees", async () => {
      const employees = await Employee.find({
        employemenStatus: "ACTIVE",
        isDeleted: false,
      }).lean();
      return employees.map((emp) => ({
        _id: emp._id.toString(),
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        department: emp.department,
      }));
    });

    // Step 3: Get employee IDs on leave today
    const onLeaveIds = await step.run("get-on-leave-ids", async () => {
      const leaves = await LeaveApplication.find({
        status: "APPROVED",
        startDate: { $lt: new Date(today.endUTC) },
        endDate: { $gte: new Date(today.startUTC) },
      }).lean();
      return leaves.map((l) => l.employeeId.toString());
    });

    // Step 4: Get employee IDs who already checkedIn today
    const checkedInIds = await step.run("get-checked-in-ids", async () => {
      const attendances = await Attendance.find({
        date: { $gte: new Date(today.startUTC), $lt: new Date(today.endUTC) },
      }).lean();
      return attendances.map((a) => a.employeeId.toString());
    });

    // Step 5: filter absent employees (not on leave & not checked In)
    const absentEmployees = activeEmployees.filter(
      (emp) => !onLeaveIds.includes(emp._id),
    );

    // Step 6: Send reminder emails
    if (absentEmployees) {
      await step.run("send-reminder-emails", async () => {
        const emailPromises = absentEmployees.map((emp) => {
          // send email logic
        });
      });
    }
    return {
      totalActive: activeEmployees.length,
      onLeave: onLeaveIds.length,
      checkedIn: checkedInIds.length,
      absent: absentEmployees.length,
    };
  },
);
// Create an empty array where we'll export future Inngest functions
export const functions = [
  autoCheckout,
  leaveApplicationReminder,
  attendanceReminderCron,
];
