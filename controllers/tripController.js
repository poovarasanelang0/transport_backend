const Trip = require("../models/tripModel");
const Project = require("../models/projectModel");
const Vehicle = require("../models/vehicleModel");
const Driver = require("../models/driverModel");
const { validationResult } = require("express-validator");

// Get all trips
const getAllTrips = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      projectId = "",
      vehicleId = "",
      driverId = "",
      dateFrom = "",
      dateTo = "",
    } = req.query;
    const adminId = req.admin._id;

    const query = { adminId };

    // Search filter
    if (search) {
      query.$or = [
        { tripId: { $regex: search, $options: "i" } },
        { source: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Project filter
    if (projectId) {
      query.projectId = projectId;
    }

    // Vehicle filter
    if (vehicleId) {
      query.vehicleId = vehicleId;
    }

    // Driver filter
    if (driverId) {
      query.driverId = driverId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) {
        query.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.date.$lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

    const trips = await Trip.find(query)
      .populate(
        "projectId",
        "projectId projectName type customerName companyName amount startDate endDate"
      )
      .populate("vehicleId", "vehicleId registrationNumber make model")
      .populate("driverId", "driverId firstName lastName mobile")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add financial calculations to each trip
    const tripsWithFinancials = trips.map((trip) => {
      const tripObj = trip.toObject();
      tripObj.financials = trip.calculateFinancials(trip.projectId);
      return tripObj;
    });

    const total = await Trip.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        trips: tripsWithFinancials,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all trips error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get trip by ID
const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const trip = await Trip.findOne({ _id: id, adminId })
      .populate(
        "projectId",
        "projectId projectName type customerName companyName place amount startDate endDate"
      )
      .populate(
        "vehicleId",
        "vehicleId registrationNumber make model year vehicleType"
      )
      .populate(
        "driverId",
        "driverId firstName lastName mobile email licenseNumber"
      );

    if (!trip) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    // Add financial calculations to the trip
    const tripWithFinancials = trip.toObject();
    tripWithFinancials.financials = trip.calculateFinancials(trip.projectId);

    res.status(200).json({
      status: "success",
      data: {
        trip: tripWithFinancials,
      },
    });
  } catch (error) {
    console.error("Get trip by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Create new trip
const createTrip = async (req, res) => {
  try {
    const {
      projectId,
      vehicleId,
      driverId,
      date,
      source,
      destination,
      km,
      tons,
      days,
      status = "Upcoming",
      fuelAdvance,
      driverAmountPerTrip,
      driverAdvanceAmount,
      notes = "",
    } = req.body;

    const adminId = req.admin._id;

    // Validate project exists and belongs to admin
    const project = await Project.findOne({ _id: projectId, adminId });
    if (!project) {
      return res.status(400).json({
        status: "error",
        message: "Invalid project",
      });
    }

    // Validate vehicle exists and belongs to admin
    const vehicle = await Vehicle.findOne({ _id: vehicleId, adminId });
    if (!vehicle) {
      return res.status(400).json({
        status: "error",
        message: "Invalid vehicle",
      });
    }

    // Validate driver exists and belongs to admin
    const driver = await Driver.findOne({ _id: driverId, adminId });
    if (!driver) {
      return res.status(400).json({
        status: "error",
        message: "Invalid driver",
      });
    }

    // Check if vehicle is available
    if (!vehicle.isAvailable) {
      return res.status(400).json({
        status: "error",
        message: "Vehicle is not available",
      });
    }

    // Check if driver is available
    if (!driver.isAvailable) {
      return res.status(400).json({
        status: "error",
        message: "Driver is not available",
      });
    }

    // Generate unique tripId
    const timestamp = Date.now().toString().slice(-8);
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const tripId = `TRP${timestamp}${randomSuffix}`;

    // Create new trip
    const trip = new Trip({
      tripId,
      projectId,
      vehicleId,
      driverId,
      date: new Date(date),
      source,
      destination,
      km: km ? parseFloat(km) : null,
      tons: tons ? parseFloat(tons) : null,
      days: days ? parseInt(days) : null,
      status,
      fuelAdvance: parseFloat(fuelAdvance),
      driverAmountPerTrip: parseFloat(driverAmountPerTrip),
      driverAdvanceAmount: parseFloat(driverAdvanceAmount),
      notes,
      adminId,
    });

    await trip.save();

    // Populate the created trip
    await trip.populate([
      {
        path: "projectId",
        select:
          "projectId projectName type customerName companyName amount startDate endDate",
      },
      { path: "vehicleId", select: "vehicleId registrationNumber make model" },
      { path: "driverId", select: "driverId firstName lastName mobile" },
    ]);

    // Add financial calculations to the trip
    const tripWithFinancials = trip.toObject();
    tripWithFinancials.financials = trip.calculateFinancials(trip.projectId);

    res.status(201).json({
      status: "success",
      message: "Trip created successfully",
      data: {
        trip: tripWithFinancials,
      },
    });
  } catch (error) {
    console.error("Create trip error:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      if (error.keyPattern?.tripId) {
        return res.status(400).json({
          status: "error",
          message: "Trip ID already exists. Please try again.",
        });
      }
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Update trip
const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;
    const updateData = req.body;

    const trip = await Trip.findOne({ _id: id, adminId });
    if (!trip) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    // Validate project if being updated
    if (updateData.projectId) {
      const project = await Project.findOne({
        _id: updateData.projectId,
        adminId,
      });
      if (!project) {
        return res.status(400).json({
          status: "error",
          message: "Invalid project",
        });
      }
    }

    // Validate vehicle if being updated
    if (updateData.vehicleId) {
      const vehicle = await Vehicle.findOne({
        _id: updateData.vehicleId,
        adminId,
      });
      if (!vehicle) {
        return res.status(400).json({
          status: "error",
          message: "Invalid vehicle",
        });
      }
    }

    // Validate driver if being updated
    if (updateData.driverId) {
      const driver = await Driver.findOne({
        _id: updateData.driverId,
        adminId,
      });
      if (!driver) {
        return res.status(400).json({
          status: "error",
          message: "Invalid driver",
        });
      }
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (key === "date" || key === "startTime" || key === "endTime") {
        trip[key] = new Date(updateData[key]);
      } else if (
        key === "km" ||
        key === "tons" ||
        key === "fuelAdvance" ||
        key === "driverAmountPerTrip" ||
        key === "driverAdvanceAmount"
      ) {
        trip[key] = updateData[key] ? parseFloat(updateData[key]) : null;
      } else if (key === "days") {
        trip[key] = updateData[key] ? parseInt(updateData[key]) : null;
      } else {
        trip[key] = updateData[key];
      }
    });

    await trip.save();

    // Populate the updated trip
    await trip.populate([
      {
        path: "projectId",
        select:
          "projectId projectName type customerName companyName amount startDate endDate",
      },
      { path: "vehicleId", select: "vehicleId registrationNumber make model" },
      { path: "driverId", select: "driverId firstName lastName mobile" },
    ]);

    // Add financial calculations to the trip
    const tripWithFinancials = trip.toObject();
    tripWithFinancials.financials = trip.calculateFinancials(trip.projectId);

    res.status(200).json({
      status: "success",
      message: "Trip updated successfully",
      data: {
        trip: tripWithFinancials,
      },
    });
  } catch (error) {
    console.error("Update trip error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Delete trip
const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const trip = await Trip.findOne({ _id: id, adminId });
    if (!trip) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    await Trip.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Update trip status
const updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      startTime,
      endTime,
      actualKm,
      actualTons,
      actualDays,
      notes,
    } = req.body;
    const adminId = req.admin._id;

    const trip = await Trip.findOne({ _id: id, adminId });
    if (!trip) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    // Validate status transition
    const validTransitions = {
      Upcoming: ["On Process", "Completed", "Cancelled"],
      "On Process": ["Completed", "Cancelled"],
      Completed: ["On Process"],
      Cancelled: ["Upcoming", "On Process"],
    };

    if (
      !validTransitions[trip.status] ||
      !validTransitions[trip.status].includes(status)
    ) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status transition from ${trip.status} to ${status}`,
      });
    }

    // Update status and related fields
    const oldStatus = trip.status;
    trip.status = status;

    // Auto-set timestamps based on status changes
    if (
      status === "On Process" &&
      oldStatus === "Upcoming" &&
      !trip.startTime
    ) {
      trip.startTime = new Date();
    }

    if (status === "Completed" && !trip.endTime) {
      trip.endTime = new Date();
    }

    // Manual timestamp updates if provided
    if (startTime) trip.startTime = new Date(startTime);
    if (endTime) trip.endTime = new Date(endTime);
    if (actualKm !== undefined)
      trip.actualKm = actualKm ? parseFloat(actualKm) : null;
    if (actualTons !== undefined)
      trip.actualTons = actualTons ? parseFloat(actualTons) : null;
    if (actualDays !== undefined)
      trip.actualDays = actualDays ? parseInt(actualDays) : null;
    if (notes) trip.notes = notes;

    await trip.save();

    // Populate the updated trip
    await trip.populate([
      {
        path: "projectId",
        select:
          "projectId projectName type customerName companyName amount startDate endDate",
      },
      { path: "vehicleId", select: "vehicleId registrationNumber make model" },
      { path: "driverId", select: "driverId firstName lastName mobile" },
    ]);

    // Add financial calculations to the trip
    const tripWithFinancials = trip.toObject();
    tripWithFinancials.financials = trip.calculateFinancials(trip.projectId);

    res.status(200).json({
      status: "success",
      message: "Trip status updated successfully",
      data: {
        trip: tripWithFinancials,
      },
    });
  } catch (error) {
    console.error("Update trip status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get trip statistics
const getTripStats = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const totalTrips = await Trip.countDocuments({ adminId });
    const upcomingTrips = await Trip.countDocuments({
      adminId,
      status: "Upcoming",
    });
    const onProcessTrips = await Trip.countDocuments({
      adminId,
      status: "On Process",
    });
    const completedTrips = await Trip.countDocuments({
      adminId,
      status: "Completed",
    });
    const cancelledTrips = await Trip.countDocuments({
      adminId,
      status: "Cancelled",
    });

    // Status statistics
    const statusStats = await Trip.aggregate([
      { $match: { adminId: adminId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent trips
    const recentTrips = await Trip.find({ adminId })
      .select("tripId projectId vehicleId driverId status date createdAt")
      .populate("projectId", "projectName")
      .populate("vehicleId", "registrationNumber")
      .populate("driverId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: "success",
      data: {
        totalTrips,
        upcomingTrips,
        onProcessTrips,
        completedTrips,
        cancelledTrips,
        statusStats,
        recentTrips,
      },
    });
  } catch (error) {
    console.error("Get trip stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  updateTripStatus,
  getTripStats,
};
