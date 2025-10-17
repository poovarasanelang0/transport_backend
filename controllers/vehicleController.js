const Vehicle = require("../models/vehicleModel");
const Driver = require("../models/driverModel");
const { validationResult } = require("express-validator");

// Get all vehicles
const getAllVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      vehicleType = "",
      fuelType = "",
      isAvailable = "",
      groupId = "",
    } = req.query;
    const adminId = req.admin.id;

    const query = { adminId };

    // Search filter
    if (search) {
      query.$or = [
        { registrationNumber: { $regex: search, $options: "i" } },
        { make: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { vehicleId: { $regex: search, $options: "i" } },
        { color: { $regex: search, $options: "i" } },
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

    // Fuel type filter
    if (fuelType) {
      query.fuelType = fuelType;
    }

    // Availability filter
    if (isAvailable !== "") {
      query.isAvailable = isAvailable === "true";
    }

    // Group filter
    if (groupId !== "") {
      if (groupId === "none") {
        query.groupId = { $exists: false };
      } else {
        query.groupId = groupId;
      }
    }

    const skip = (page - 1) * limit;

    const vehicles = await Vehicle.find(query)
      .populate("assignedDriver", "driverId firstName lastName mobile status")
      .populate("groupId", "groupName description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        vehicles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all vehicles error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get vehicle by ID
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    const vehicle = await Vehicle.findOne({ _id: id, adminId })
      .populate(
        "assignedDriver",
        "driverId firstName lastName mobile status email"
      )
      .populate("groupId", "groupName description");

    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        vehicle,
      },
    });
  } catch (error) {
    console.error("Get vehicle by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Create new vehicle
const createVehicle = async (req, res) => {
  try {
    // Validation temporarily disabled

    const {
      registrationNumber,
      make,
      model,
      year,
      vehicleType,
      capacity,
      fuelType,
      transmission,
      color,
      insurance,
      permit,
      fitness,
      puc,
      status,
      assignedDriver,
    } = req.body;

    const adminId = req.admin.id;

    // Check if registration number already exists
    const existingVehicle = await Vehicle.findOne({
      registrationNumber: registrationNumber.toUpperCase(),
    });
    if (existingVehicle) {
      return res.status(400).json({
        status: "error",
        message: "Vehicle with this registration number already exists",
      });
    }

    // Validate assigned driver if provided
    if (assignedDriver) {
      const driver = await Driver.findOne({
        _id: assignedDriver,
        adminId,
        status: "Active",
      });
      if (!driver) {
        return res.status(400).json({
          status: "error",
          message: "Invalid driver assignment",
        });
      }
    }

    // Generate vehicleId if not provided
    let vehicleId = `VEH${Date.now().toString().slice(-6)}`;
    try {
      const count = await Vehicle.countDocuments();
      vehicleId = `VEH${String(count + 1).padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating vehicleId:", error);
    }

    // Create new vehicle
    const vehicle = new Vehicle({
      vehicleId,
      registrationNumber: registrationNumber.toUpperCase(),
      make,
      model,
      year,
      vehicleType,
      capacity: capacity || { passengers: 0, cargo: 0 },
      fuelType,
      transmission,
      color,
      insurance: insurance
        ? {
            ...insurance,
            expiryDate: insurance.expiryDate
              ? new Date(insurance.expiryDate)
              : undefined,
          }
        : {},
      permit: permit
        ? {
            ...permit,
            expiryDate: permit.expiryDate
              ? new Date(permit.expiryDate)
              : undefined,
          }
        : {},
      fitness: fitness
        ? {
            ...fitness,
            expiryDate: fitness.expiryDate
              ? new Date(fitness.expiryDate)
              : undefined,
          }
        : {},
      puc: puc
        ? {
            ...puc,
            expiryDate: puc.expiryDate ? new Date(puc.expiryDate) : undefined,
          }
        : {},
      status: status || "Active",
      assignedDriver:
        assignedDriver && assignedDriver.trim() !== "" ? assignedDriver : null,
      adminId,
    });

    await vehicle.save();

    // If driver is assigned, update driver's assigned vehicle
    if (assignedDriver) {
      await Driver.findByIdAndUpdate(assignedDriver, {
        assignedVehicle: vehicle._id,
      });
    }

    // Populate the created vehicle
    await vehicle.populate(
      "assignedDriver",
      "driverId firstName lastName mobile status"
    );

    res.status(201).json({
      status: "success",
      message: "Vehicle created successfully",
      data: {
        vehicle,
      },
    });
  } catch (error) {
    console.error("Create vehicle error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    // Validation temporarily disabled

    const { id } = req.params;
    const adminId = req.admin.id;
    const updateData = req.body;

    // Handle empty string for assignedDriver
    if (updateData.assignedDriver === "") {
      updateData.assignedDriver = null;
    }

    const vehicle = await Vehicle.findOne({ _id: id, adminId });
    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found",
      });
    }

    // Check if registration number is being changed and if it already exists
    if (
      updateData.registrationNumber &&
      updateData.registrationNumber.toUpperCase() !== vehicle.registrationNumber
    ) {
      const existingVehicle = await Vehicle.findOne({
        registrationNumber: updateData.registrationNumber.toUpperCase(),
      });
      if (existingVehicle) {
        return res.status(400).json({
          status: "error",
          message: "Vehicle with this registration number already exists",
        });
      }
      updateData.registrationNumber =
        updateData.registrationNumber.toUpperCase();
    }

    // Validate assigned driver if being changed
    if (updateData.assignedDriver !== undefined) {
      if (updateData.assignedDriver) {
        const driver = await Driver.findOne({
          _id: updateData.assignedDriver,
          adminId,
          status: "Active",
        });
        if (!driver) {
          return res.status(400).json({
            status: "error",
            message: "Invalid driver assignment",
          });
        }
      }

      // Update previous driver's assigned vehicle if exists
      if (vehicle.assignedDriver) {
        await Driver.findByIdAndUpdate(vehicle.assignedDriver, {
          $unset: { assignedVehicle: 1 },
        });
      }

      // Update new driver's assigned vehicle
      if (updateData.assignedDriver) {
        await Driver.findByIdAndUpdate(updateData.assignedDriver, {
          assignedVehicle: vehicle._id,
        });
      }
    }

    // Update vehicle fields
    Object.keys(updateData).forEach((key) => {
      if (
        key === "insurance" ||
        key === "permit" ||
        key === "fitness" ||
        key === "puc"
      ) {
        // Handle nested objects
        if (updateData[key]) {
          const updatedNested = { ...vehicle[key], ...updateData[key] };
          // Convert expiry date to Date object if present
          if (updatedNested.expiryDate) {
            updatedNested.expiryDate = new Date(updatedNested.expiryDate);
          }
          vehicle[key] = updatedNested;
        }
      } else if (key === "capacity") {
        // Handle capacity object
        if (updateData[key]) {
          vehicle[key] = { ...vehicle[key], ...updateData[key] };
        }
      } else {
        vehicle[key] = updateData[key];
      }
    });

    await vehicle.save();

    // Populate the updated vehicle
    await vehicle.populate(
      "assignedDriver",
      "driverId firstName lastName mobile status"
    );

    res.status(200).json({
      status: "success",
      message: "Vehicle updated successfully",
      data: {
        vehicle,
      },
    });
  } catch (error) {
    console.error("Update vehicle error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    const vehicle = await Vehicle.findOne({ _id: id, adminId });
    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found",
      });
    }

    // Remove vehicle assignment from driver if exists
    if (vehicle.assignedDriver) {
      await Driver.findByIdAndUpdate(vehicle.assignedDriver, {
        $unset: { assignedVehicle: 1 },
      });
    }

    await Vehicle.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Toggle vehicle status
const toggleVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    const vehicle = await Vehicle.findOne({ _id: id, adminId });
    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found",
      });
    }

    // Toggle between Active and Inactive
    vehicle.status = vehicle.status === "Active" ? "Inactive" : "Active";
    await vehicle.save();

    res.status(200).json({
      status: "success",
      message: `Vehicle ${vehicle.status.toLowerCase()} successfully`,
      data: {
        vehicle: {
          id: vehicle._id,
          vehicleId: vehicle.vehicleId,
          registrationNumber: vehicle.registrationNumber,
          status: vehicle.status,
          isAvailable: vehicle.isAvailable,
        },
      },
    });
  } catch (error) {
    console.error("Toggle vehicle status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Assign driver to vehicle
const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const adminId = req.admin.id;

    const vehicle = await Vehicle.findOne({ _id: id, adminId });
    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found",
      });
    }

    // If driverId is provided, validate and assign
    if (driverId) {
      const driver = await Driver.findOne({
        _id: driverId,
        adminId,
        status: "Active",
      });
      if (!driver) {
        return res.status(400).json({
          status: "error",
          message: "Invalid driver",
        });
      }

      // Check if driver is already assigned to another vehicle
      if (driver.assignedVehicle && driver.assignedVehicle.toString() !== id) {
        return res.status(400).json({
          status: "error",
          message: "Driver is already assigned to another vehicle",
        });
      }

      // Remove previous assignment if exists
      if (vehicle.assignedDriver) {
        await Driver.findByIdAndUpdate(vehicle.assignedDriver, {
          $unset: { assignedVehicle: 1 },
        });
      }

      // Assign new driver
      vehicle.assignedDriver = driverId;
      await Driver.findByIdAndUpdate(driverId, {
        assignedVehicle: vehicle._id,
      });
    } else {
      // Unassign driver
      if (vehicle.assignedDriver) {
        await Driver.findByIdAndUpdate(vehicle.assignedDriver, {
          $unset: { assignedVehicle: 1 },
        });
      }
      vehicle.assignedDriver = null;
    }

    await vehicle.save();

    // Populate the updated vehicle
    await vehicle.populate(
      "assignedDriver",
      "driverId firstName lastName mobile status"
    );

    res.status(200).json({
      status: "success",
      message: driverId
        ? "Driver assigned successfully"
        : "Driver unassigned successfully",
      data: {
        vehicle,
      },
    });
  } catch (error) {
    console.error("Assign driver error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get vehicle statistics
const getVehicleStats = async (req, res) => {
  try {
    const adminId = req.admin.id;

    const totalVehicles = await Vehicle.countDocuments({ adminId });
    const activeVehicles = await Vehicle.countDocuments({
      adminId,
      status: "Active",
    });
    const inactiveVehicles = await Vehicle.countDocuments({
      adminId,
      status: "Inactive",
    });
    const maintenanceVehicles = await Vehicle.countDocuments({
      adminId,
      status: "Maintenance",
    });
    const repairVehicles = await Vehicle.countDocuments({
      adminId,
      status: "Repair",
    });
    const retiredVehicles = await Vehicle.countDocuments({
      adminId,
      status: "Retired",
    });
    const availableVehicles = await Vehicle.countDocuments({
      adminId,
      isAvailable: true,
    });
    const assignedVehicles = await Vehicle.countDocuments({
      adminId,
      assignedDriver: { $exists: true, $ne: null },
    });

    // Calculate expiring documents (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringInsurance = await Vehicle.countDocuments({
      adminId,
      "insurance.expiryDate": { $lte: thirtyDaysFromNow, $gte: new Date() },
    });

    const expiringPermit = await Vehicle.countDocuments({
      adminId,
      "permit.expiryDate": { $lte: thirtyDaysFromNow, $gte: new Date() },
    });

    const expiringFitness = await Vehicle.countDocuments({
      adminId,
      "fitness.expiryDate": { $lte: thirtyDaysFromNow, $gte: new Date() },
    });

    const expiringPUC = await Vehicle.countDocuments({
      adminId,
      "puc.expiryDate": { $lte: thirtyDaysFromNow, $gte: new Date() },
    });

    // Vehicle type statistics
    const vehicleTypeStats = await Vehicle.aggregate([
      { $match: { adminId: adminId } },
      {
        $group: {
          _id: "$vehicleType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Fuel type statistics
    const fuelTypeStats = await Vehicle.aggregate([
      { $match: { adminId: adminId } },
      {
        $group: {
          _id: "$fuelType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent vehicles
    const recentVehicles = await Vehicle.find({ adminId })
      .select("vehicleId registrationNumber make model status createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: "success",
      data: {
        totalVehicles,
        activeVehicles,
        inactiveVehicles,
        maintenanceVehicles,
        repairVehicles,
        retiredVehicles,
        availableVehicles,
        assignedVehicles,
        expiringDocuments: {
          insurance: expiringInsurance,
          permit: expiringPermit,
          fitness: expiringFitness,
          puc: expiringPUC,
        },
        vehicleTypeStats,
        fuelTypeStats,
        recentVehicles,
      },
    });
  } catch (error) {
    console.error("Get vehicle stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get vehicle document expiry notifications
const getVehicleNotifications = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // Get all vehicles for the admin
    const vehicles = await Vehicle.find({ adminId }).select(
      "registrationNumber insurance permit fitness puc"
    );

    const notifications = [];

    vehicles.forEach((vehicle) => {
      // Check insurance expiry
      if (vehicle.insurance?.expiryDate) {
        const expiryDate = new Date(vehicle.insurance.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "insurance",
            expiryDate: vehicle.insurance.expiryDate,
            urgency: "expired",
            message: `Insurance has expired on ${expiryDate.toLocaleDateString()}`,
          });
        } else if (daysUntilExpiry === 0) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "insurance",
            expiryDate: vehicle.insurance.expiryDate,
            urgency: "expires-today",
            message: `Insurance expires today (${expiryDate.toLocaleDateString()})`,
          });
        } else if (daysUntilExpiry === 1) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "insurance",
            expiryDate: vehicle.insurance.expiryDate,
            urgency: "expires-tomorrow",
            message: `Insurance expires tomorrow (${expiryDate.toLocaleDateString()})`,
          });
        } else if (daysUntilExpiry === 2) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "insurance",
            expiryDate: vehicle.insurance.expiryDate,
            urgency: "expires-in-2-days",
            message: `Insurance expires in 2 days (${expiryDate.toLocaleDateString()})`,
          });
        }
      }

      // Check permit expiry
      if (vehicle.permit?.expiryDate) {
        const expiryDate = new Date(vehicle.permit.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "permit",
            expiryDate: vehicle.permit.expiryDate,
            urgency: "expired",
            message: `Permit has expired on ${expiryDate.toLocaleDateString()}`,
          });
        } else if (daysUntilExpiry === 0) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "permit",
            expiryDate: vehicle.permit.expiryDate,
            urgency: "expires-today",
            message: `Permit expires today (${expiryDate.toLocaleDateString()})`,
          });
        } else if (daysUntilExpiry === 1) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "permit",
            expiryDate: vehicle.permit.expiryDate,
            urgency: "expires-tomorrow",
            message: `Permit expires tomorrow (${expiryDate.toLocaleDateString()})`,
          });
        } else if (daysUntilExpiry === 2) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "permit",
            expiryDate: vehicle.permit.expiryDate,
            urgency: "expires-in-2-days",
            message: `Permit expires in 2 days (${expiryDate.toLocaleDateString()})`,
          });
        }
      }

      // Check fitness certificate expiry
      if (vehicle.fitness?.expiryDate) {
        const expiryDate = new Date(vehicle.fitness.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "fitness",
            expiryDate: vehicle.fitness.expiryDate,
            urgency: "expired",
            message: `Fitness Certificate has expired on ${expiryDate.toLocaleDateString()}`,
          });
        } else if (daysUntilExpiry === 0) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "fitness",
            expiryDate: vehicle.fitness.expiryDate,
            urgency: "expires-today",
            message: `Fitness Certificate expires today (${expiryDate.toLocaleDateString()})`,
          });
        } else if (daysUntilExpiry === 1) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "fitness",
            expiryDate: vehicle.fitness.expiryDate,
            urgency: "expires-tomorrow",
            message: `Fitness Certificate expires tomorrow (${expiryDate.toLocaleDateString()})`,
          });
        } else if (daysUntilExpiry === 2) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "fitness",
            expiryDate: vehicle.fitness.expiryDate,
            urgency: "expires-in-2-days",
            message: `Fitness Certificate expires in 2 days (${expiryDate.toLocaleDateString()})`,
          });
        }
      }

      // Check PUC certificate expiry
      if (vehicle.puc?.expiryDate) {
        const expiryDate = new Date(vehicle.puc.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "puc",
            expiryDate: vehicle.puc.expiryDate,
            urgency: "expired",
            message: `PUC Certificate has expired on ${expiryDate.toLocaleDateString()}`,
          });
        } else if (daysUntilExpiry === 0) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "puc",
            expiryDate: vehicle.puc.expiryDate,
            urgency: "expires-today",
            message: `PUC Certificate expires today (${expiryDate.toLocaleDateString()})`,
          });
        } else if (daysUntilExpiry === 1) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "puc",
            expiryDate: vehicle.puc.expiryDate,
            urgency: "expires-tomorrow",
            message: `PUC Certificate expires tomorrow (${expiryDate.toLocaleDateString()})`,
          });
        } else if (daysUntilExpiry === 2) {
          notifications.push({
            vehicleRegistration: vehicle.registrationNumber,
            documentType: "puc",
            expiryDate: vehicle.puc.expiryDate,
            urgency: "expires-in-2-days",
            message: `PUC Certificate expires in 2 days (${expiryDate.toLocaleDateString()})`,
          });
        }
      }
    });

    // Sort notifications by urgency (expired first, then by days until expiry)
    notifications.sort((a, b) => {
      const urgencyOrder = {
        expired: 0,
        "expires-today": 1,
        "expires-tomorrow": 2,
        "expires-in-2-days": 3,
      };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    res.status(200).json({
      status: "success",
      data: {
        notifications,
        total: notifications.length,
      },
    });
  } catch (error) {
    console.error("Error fetching vehicle notifications:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch vehicle notifications",
    });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleStatus,
  assignDriver,
  getVehicleStats,
  getVehicleNotifications,
};
