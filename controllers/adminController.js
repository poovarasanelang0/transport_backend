const Admin = require("../models/adminModel");
const { validationResult } = require("express-validator");

// Get all admins (for super admin)
const getAllAdmins = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      licenseType = "",
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { adminName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { adminId: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.isActive = status === "active";
    }

    // License type filter
    if (licenseType) {
      query.licenseType = licenseType;
    }

    const skip = (page - 1) * limit;

    const admins = await Admin.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Admin.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        admins,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all admins error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get admin by ID
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
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
    console.error("Get admin by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Create new admin (super admin only)
const createAdmin = async (req, res) => {
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

    res.status(201).json({
      status: "success",
      message: "Admin created successfully",
      data: {
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
          isActive: admin.isActive,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Update admin
const updateAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const {
      companyName,
      adminName,
      email,
      mobile,
      licenseType,
      companySize,
      subscriptionPeriod,
      role,
      isActive,
    } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== admin.email) {
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      if (existingAdmin) {
        return res.status(400).json({
          status: "error",
          message: "Email already registered",
        });
      }
    }

    // Update fields
    if (companyName) admin.companyName = companyName;
    if (adminName) admin.adminName = adminName;
    if (email) admin.email = email.toLowerCase();
    if (mobile) admin.mobile = mobile;
    if (licenseType) admin.licenseType = licenseType;
    if (companySize) admin.companySize = companySize;
    if (role) admin.role = role;
    if (typeof isActive === "boolean") admin.isActive = isActive;

    // Update subscription if period changed
    if (subscriptionPeriod && subscriptionPeriod !== admin.subscriptionPeriod) {
      admin.subscriptionPeriod = subscriptionPeriod;
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + subscriptionPeriod);
      admin.subscriptionEnd = subscriptionEnd;
    }

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Admin updated successfully",
      data: {
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
          isActive: admin.isActive,
          updatedAt: admin.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
      });
    }

    // Check if trying to delete own account
    if (req.admin.id === id) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete your own account",
      });
    }

    await Admin.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Toggle admin status
const toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
      });
    }

    // Check if trying to deactivate own account
    if (req.admin.id === id) {
      return res.status(400).json({
        status: "error",
        message: "Cannot deactivate your own account",
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.status(200).json({
      status: "success",
      message: `Admin ${
        admin.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          companyName: admin.companyName,
          adminName: admin.adminName,
          isActive: admin.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Toggle admin status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get admin statistics
const getAdminStats = async (req, res) => {
  try {
    const totalAdmins = await Admin.countDocuments();
    const activeAdmins = await Admin.countDocuments({ isActive: true });
    const inactiveAdmins = await Admin.countDocuments({ isActive: false });

    const licenseStats = await Admin.aggregate([
      {
        $group: {
          _id: "$licenseType",
          count: { $sum: 1 },
        },
      },
    ]);

    const companySizeStats = await Admin.aggregate([
      {
        $group: {
          _id: "$companySize",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentAdmins = await Admin.find()
      .select("adminId companyName adminName createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: "success",
      data: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        licenseStats,
        companySizeStats,
        recentAdmins,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
  getAdminStats,
};
