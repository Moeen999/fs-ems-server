import Employee from "../models/Employee.js";

// Get Profile
// GET api/profile

export const getProfile = async (req, res) => {
    try {
        const session=req.session;
        const employee = await Employee.findOne({userId: session.id});
        if (!employee) {
            // this user is not an employee return admin profile
            return res.json({
                firstName: "Admin",
                lastName: "",
                email: session.email,
            })
        }
        return res.json(employee);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch profile" });
    }
}


// Update Profile
// PUT api/profile

export const updateProfile = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.id });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        if(employee.isDeleted){
            return res.status(404).json({ error: "your account is deactivated, you can not update your profile" });
        }
        const updatedEmployee = await Employee.findOneAndUpdate(
            { _id: employee._id },
            { bio: req.body.bio },
            { new: true }
        );
        return res.status(200).json({ success: true, data: updatedEmployee });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update profile" });
    }
}