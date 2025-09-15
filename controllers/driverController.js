const Driver = require("../models/driverModel");
const { validationResult } = require("express-validator");

// Get all drivers
const getAllDrivers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      vehicleType = "",
    } = req.query;
    const adminId = req.admin._id;

    const query = { adminId };

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { driverId: { $regex: search, $options: "i" } },
        { licenseNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Vehicle type filter
    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    const skip = (page - 1) * limit;

    const drivers = await Driver.find(query)
      .populate("assignedVehicle", "vehicleId registrationNumber make model")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Driver.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        drivers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all drivers error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get driver by ID
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const driver = await Driver.findOne({ _id: id, adminId }).populate(
      "assignedVehicle",
      "vehicleId registrationNumber make model year"
    );

    if (!driver) {
      return res.status(404).json({
        status: "error",
        message: "Driver not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        driver,
      },
    });
  } catch (error) {
    console.error("Get driver by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Create new driver
const createDriver = async (req, res) => {
  try {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "Validation error",
    //     errors: errors.array(),
    //   });
    // }

    const {
      firstName,
      lastName,
      email,
      mobile,
      licenseNumber,
      licenseExpiry,
      dateOfBirth,
      address,
      emergencyContact,
      experience,
      vehicleType,
    } = req.body;

    const adminId = req.admin._id;

    // Check if email already exists
    const existingDriver = await Driver.findOne({ email: email.toLowerCase() });
    if (existingDriver) {
      return res.status(400).json({
        status: "error",
        message: "Email already registered",
      });
    }

    // Check if license number already exists
    const existingLicense = await Driver.findOne({ licenseNumber });
    if (existingLicense) {
      return res.status(400).json({
        status: "error",
        message: "License number already registered",
      });
    }

    // Create new driver
    const driver = new Driver({
      firstName,
      lastName,
      email: email.toLowerCase(),
      mobile,
      licenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      dateOfBirth: new Date(dateOfBirth),
      address,
      emergencyContact,
      experience,
      vehicleType,
      adminId,
    });

    // Generate unique driverId using timestamp approach
    const timestamp = Date.now().toString().slice(-8);
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    driver.driverId = `DRV${timestamp}${randomSuffix}`;

    console.log(`Controller generated driverId: ${driver.driverId}`);

    await driver.save();

    res.status(201).json({
      status: "success",
      message: "Driver created successfully",
      data: {
        driver: {
          id: driver._id,
          driverId: driver.driverId,
          firstName: driver.firstName,
          lastName: driver.lastName,
          fullName: driver.fullName,
          email: driver.email,
          mobile: driver.mobile,
          licenseNumber: driver.licenseNumber,
          licenseStatus: driver.licenseStatus,
          status: driver.status,
          vehicleType: driver.vehicleType,
          experience: driver.experience,
          createdAt: driver.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Create driver error:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      if (error.keyPattern?.driverId) {
        return res.status(400).json({
          status: "error",
          message: "Driver ID already exists. Please try again.",
        });
      } else if (error.keyPattern?.email) {
        return res.status(400).json({
          status: "error",
          message: "Email already registered",
        });
      } else if (error.keyPattern?.licenseNumber) {
        return res.status(400).json({
          status: "error",
          message: "License number already registered",
        });
      }
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Update driver
const updateDriver = async (req, res) => {
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
    const adminId = req.admin._id;
    const updateData = req.body;

    const driver = await Driver.findOne({ _id: id, adminId });
    if (!driver) {
      return res.status(404).json({
        status: "error",
        message: "Driver not found",
      });
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email.toLowerCase() !== driver.email) {
      const existingDriver = await Driver.findOne({
        email: updateData.email.toLowerCase(),
      });
      if (existingDriver) {
        return res.status(400).json({
          status: "error",
          message: "Email already registered",
        });
      }
    }

    // Check if license number is being changed and if it already exists
    if (
      updateData.licenseNumber &&
      updateData.licenseNumber !== driver.licenseNumber
    ) {
      const existingLicense = await Driver.findOne({
        licenseNumber: updateData.licenseNumber,
      });
      if (existingLicense) {
        return res.status(400).json({
          status: "error",
          message: "License number already registered",
        });
      }
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (key === "licenseExpiry" || key === "dateOfBirth") {
        driver[key] = new Date(updateData[key]);
      } else {
        driver[key] = updateData[key];
      }
    });

    await driver.save();

    res.status(200).json({
      status: "success",
      message: "Driver updated successfully",
      data: {
        driver: {
          id: driver._id,
          driverId: driver.driverId,
          firstName: driver.firstName,
          lastName: driver.lastName,
          fullName: driver.fullName,
          email: driver.email,
          mobile: driver.mobile,
          licenseNumber: driver.licenseNumber,
          licenseStatus: driver.licenseStatus,
          status: driver.status,
          vehicleType: driver.vehicleType,
          experience: driver.experience,
          updatedAt: driver.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Update driver error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Delete driver
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const driver = await Driver.findOne({ _id: id, adminId });
    if (!driver) {
      return res.status(404).json({
        status: "error",
        message: "Driver not found",
      });
    }

    await Driver.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("Delete driver error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Toggle driver status
const toggleDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const driver = await Driver.findOne({ _id: id, adminId });
    if (!driver) {
      return res.status(404).json({
        status: "error",
        message: "Driver not found",
      });
    }

    // Toggle between Active and Inactive
    driver.status = driver.status === "Active" ? "Inactive" : "Active";
    driver.isAvailable = driver.status === "Active";
    await driver.save();

    res.status(200).json({
      status: "success",
      message: `Driver ${driver.status.toLowerCase()} successfully`,
      data: {
        driver: {
          id: driver._id,
          driverId: driver.driverId,
          fullName: driver.fullName,
          status: driver.status,
          isAvailable: driver.isAvailable,
        },
      },
    });
  } catch (error) {
    console.error("Toggle driver status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get driver statistics
const getDriverStats = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const totalDrivers = await Driver.countDocuments({ adminId });
    const activeDrivers = await Driver.countDocuments({
      adminId,
      status: "Active",
    });
    const inactiveDrivers = await Driver.countDocuments({
      adminId,
      status: "Inactive",
    });
    const availableDrivers = await Driver.countDocuments({
      adminId,
      isAvailable: true,
    });

    const vehicleTypeStats = await Driver.aggregate([
      { $match: { adminId: adminId } },
      {
        $group: {
          _id: "$vehicleType",
          count: { $sum: 1 },
        },
      },
    ]);

    const experienceStats = await Driver.aggregate([
      { $match: { adminId: adminId } },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ["$experience", 1] },
              "Less than 1 year",
              {
                $cond: [
                  { $lt: ["$experience", 5] },
                  "1-5 years",
                  {
                    $cond: [
                      { $lt: ["$experience", 10] },
                      "5-10 years",
                      "More than 10 years",
                    ],
                  },
                ],
              },
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const recentDrivers = await Driver.find({ adminId })
      .select("driverId firstName lastName status createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: "success",
      data: {
        totalDrivers,
        activeDrivers,
        inactiveDrivers,
        availableDrivers,
        vehicleTypeStats,
        experienceStats,
        recentDrivers,
      },
    });
  } catch (error) {
    console.error("Get driver stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  toggleDriverStatus,
  getDriverStats,
};
