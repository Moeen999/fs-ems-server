// Login for employee and admin
// POST /api/auth/login
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password, role_type } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (role_type === "ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Not an admin." });
    }
    if (role_type === "EMPLOYEE" && user.role !== "EMPLOYEE") {
      return res.status(403).json({ error: "Access denied. Not an employee." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ user: payload, token });
  } catch (error) {
    res.status(500).json({ error: "Failed to login." });
  }
};

// Get session for employee and admin
// GET /api/auth/session
export const getSession = (req, res) => {
  const session = req.session;
  return res.json({ user: session });
};

// Change password for employee and admin
// POST /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const session = req.session;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new passwords are required." });
    }
    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(session.userId, { password: hashedPassword });
    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to change password." });
  }
};
