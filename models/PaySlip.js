import mongoose from "mongoose";

const pasySlipSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Employee",
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const PaySlip =
  mongoose.models.PaySlip || mongoose.model("PaySlip", pasySlipSchema);

export default PaySlip;
