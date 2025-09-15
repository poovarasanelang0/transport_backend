const Admin = require("../models/adminModel");
const { generateToken } = require("../middleware/auth");
const { validationResult } = require("express-validator");

// Login admin or super admin
const loginAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = generateToken(admin._id);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          companyName: admin.companyName,
          adminName: admin.adminName,
          email: admin.email,
          role: admin.role,
          licenseType: admin.licenseType,
          companySize: admin.companySize,
          subscriptionEnd: admin.subscriptionEnd,
          subscriptionStatus: admin.subscriptionStatus,
          lastLogin: admin.lastLogin,
          profileImage: admin.profileImage,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Register new admin
const registerAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const {
      companyName,
      adminName,
      email,
      mobile,
      password,
      licenseType = "Standard",
      companySize = "10-20 Vehicles",
      subscriptionPeriod = 12,
      role = "admin",
    } = req.body;

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        status: "error",
        message: "Email already registered",
      });
    }

    // Calculate subscription end date
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + subscriptionPeriod);

    // Create new admin
    const admin = new Admin({
      companyName,
      adminName,
      email: email.toLowerCase(),
      mobile,
      password,
      role,
      licenseType,
      companySize,
      subscriptionPeriod,
      subscriptionEnd,
    });

    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    res.status(201).json({
      status: "success",
      message: "Admin registered successfully",
      data: {
        token,
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          companyName: admin.companyName,
          adminName: admin.adminName,
          email: admin.email,
          role: admin.role,
          licenseType: admin.licenseType,
          companySize: admin.companySize,
          subscriptionEnd: admin.subscriptionEnd,
          subscriptionStatus: admin.subscriptionStatus,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Email not found",
      });
    }

    // Generate reset token
    const resetToken = admin.generateResetPasswordToken();
    await admin.save();

    // TODO: Send email with reset token
    // For now, just return success
    res.status(200).json({
      status: "success",
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get current admin profile
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        admin,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Update admin profile
const updateProfile = async (req, res) => {
  try {
    const { adminName, mobile, address, settings } = req.body;

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
      });
    }

    // Update fields
    if (adminName) admin.adminName = adminName;
    if (mobile) admin.mobile = mobile;
    if (address) admin.address = address;
    if (settings) admin.settings = settings;

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        admin,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

module.exports = {
  loginAdmin,
  registerAdmin,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
};
