import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Employee",
    },
    date: { type: Date, required: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE"],
      default: "PRESENT",
    },
    workingHours: { type: Number, default: null },
    daytype: {
      type: String,
      enum: ["Full Day", "Three Quarter Day", "Half Day", "Short Day", null],
      default: "WEEKDAY",
    },
  },
  {
    timestamps: true,
  },
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true }); // is ye ho ga ki ek employee ek din me sirf ek hi attendance record create kar sakta hai

const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

export default Attendance;
