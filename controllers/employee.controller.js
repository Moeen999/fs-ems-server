import Employee from "../models/Employee.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

// GET Emp
// GET /api/employees
export const getEmployees = async (req, res) => {
  try {
    const { department } = req.query;
    const where = {};
    if (department) where.department = department;
    const employees = (await Employee.find(where))
      .toSorted({ createdAt: -1 })
      .populate("userId", "email role")
      .lean();
    const result = employees.map((emp) => ({
      ...emp,
      id: emp._id.toString(),
      user: emp.userId
        ? { email: emp.userId.email, role: emp.userId.role }
        : null,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees." });
  }
};

// Create Emp
// POST /api/employees

export const createEmployees = async (req, res) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      position,
      email,
      phone,
      basicSalary,
      allowances,
      deductions,
      joinDate,
      bio,
      department,
      password,
      role,
    } = req.body;
    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || "EMPLOYEE",
    });

    const employee = await Employee.create({
      userId: user._id,
      firstName,
      lastName,
      position,
      email,
      phone,
      basicSalary: Number(basicSalary) || 0,
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      joinDate: new Date(joinDate),
      bio: bio || "",
      department: department || "Engineering",
    });
    res.status(201).json({ success: true, employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists." });
    }
    res.status(500).json({ error: "Failed to create employee." });
  }
};

// Update Emp
// PUT /api/employees/:id

export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      firstName,
      lastName,
      position,
      email,
      phone,
      basicSalary,
      allowances,
      deductions,
      bio,
      department,
      password,
      role,
      employmentStatus,
    } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || "EMPLOYEE",
    });

    await Employee.findByIdAndUpdate(id, {
      firstName,
      lastName,
      position,
      email,
      phone,
      basicSalary: Number(basicSalary) || 0,
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      bio: bio || "",
      department: department || "Engineering",
      employmentStatus: employmentStatus || "ACTIVE",
    });

    // update user record
    const userUpdate = { email };
    if (role) userUpdate.role = role;
    if (password) userUpdate.password = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(employee.userId, userUpdate);

    res
      .status(200)
      .json({ success: true, message: "Employee updated successfully." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists." });
    }
    res.status(500).json({ error: "Failed to update employee." });
  }
};

// Delete Emp
// DELETE /api/employees/:id

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found." });
    }
    employee.isDeleted = true;
    employee.employmentStatus = "INACTIVE";
    await employee.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete employee." });
  }
};
