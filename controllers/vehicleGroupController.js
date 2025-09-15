const VehicleGroup = require("../models/vehicleGroupModel");
const Vehicle = require("../models/vehicleModel");
const { validationResult } = require("express-validator");

// Get all vehicle groups
const getAllVehicleGroups = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", isActive = "" } = req.query;
    const adminId = req.admin._id;

    const query = { adminId };

    // Search filter
    if (search) {
      query.$or = [
        { groupName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Active filter
    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;

    const groups = await VehicleGroup.find(query)
      .populate("vehicleCount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VehicleGroup.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        groups,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all vehicle groups error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get vehicle group by ID
const getVehicleGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const group = await VehicleGroup.findOne({ _id: id, adminId }).populate(
      "vehicleCount"
    );

    if (!group) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle group not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        group,
      },
    });
  } catch (error) {
    console.error("Get vehicle group by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Create new vehicle group
const createVehicleGroup = async (req, res) => {
  try {
    const { groupName, description = "" } = req.body;
    const adminId = req.admin._id;

    // Check if group name already exists for this admin
    const existingGroup = await VehicleGroup.findOne({
      groupName: groupName.trim(),
      adminId,
    });

    if (existingGroup) {
      return res.status(400).json({
        status: "error",
        message: "Group name already exists",
      });
    }

    // Create new group
    const group = new VehicleGroup({
      groupName: groupName.trim(),
      description: description.trim(),
      adminId,
    });

    await group.save();

    res.status(201).json({
      status: "success",
      message: "Vehicle group created successfully",
      data: {
        group,
      },
    });
  } catch (error) {
    console.error("Create vehicle group error:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      if (error.keyPattern?.groupName) {
        return res.status(400).json({
          status: "error",
          message: "Group name already exists",
        });
      }
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Update vehicle group
const updateVehicleGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;
    const updateData = req.body;

    const group = await VehicleGroup.findOne({ _id: id, adminId });
    if (!group) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle group not found",
      });
    }

    // Check if group name is being changed and if it already exists
    if (
      updateData.groupName &&
      updateData.groupName.trim() !== group.groupName
    ) {
      const existingGroup = await VehicleGroup.findOne({
        groupName: updateData.groupName.trim(),
        adminId,
        _id: { $ne: id },
      });
      if (existingGroup) {
        return res.status(400).json({
          status: "error",
          message: "Group name already exists",
        });
      }
      updateData.groupName = updateData.groupName.trim();
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (key === "description") {
        group[key] = updateData[key].trim();
      } else {
        group[key] = updateData[key];
      }
    });

    await group.save();

    res.status(200).json({
      status: "success",
      message: "Vehicle group updated successfully",
      data: {
        group,
      },
    });
  } catch (error) {
    console.error("Update vehicle group error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Delete vehicle group
const deleteVehicleGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const group = await VehicleGroup.findOne({ _id: id, adminId });
    if (!group) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle group not found",
      });
    }

    // Check if group has vehicles assigned
    const vehiclesInGroup = await Vehicle.countDocuments({
      groupId: id,
      adminId,
    });
    if (vehiclesInGroup > 0) {
      return res.status(400).json({
        status: "error",
        message: `Cannot delete group. ${vehiclesInGroup} vehicle(s) are assigned to this group. Please reassign or remove vehicles first.`,
      });
    }

    await VehicleGroup.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Vehicle group deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle group error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Toggle vehicle group status
const toggleVehicleGroupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const group = await VehicleGroup.findOne({ _id: id, adminId });
    if (!group) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle group not found",
      });
    }

    // Toggle between Active and Inactive
    group.isActive = !group.isActive;
    await group.save();

    res.status(200).json({
      status: "success",
      message: `Vehicle group ${
        group.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        group: {
          id: group._id,
          groupName: group.groupName,
          isActive: group.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Toggle vehicle group status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get vehicles in a specific group
const getVehiclesInGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const group = await VehicleGroup.findOne({ _id: id, adminId });
    if (!group) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle group not found",
      });
    }

    const vehicles = await Vehicle.find({ groupId: id, adminId })
      .populate("assignedDriver", "driverId firstName lastName mobile status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: {
        group,
        vehicles,
        count: vehicles.length,
      },
    });
  } catch (error) {
    console.error("Get vehicles in group error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get vehicle group statistics
const getVehicleGroupStats = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const totalGroups = await VehicleGroup.countDocuments({ adminId });
    const activeGroups = await VehicleGroup.countDocuments({
      adminId,
      isActive: true,
    });
    const inactiveGroups = await VehicleGroup.countDocuments({
      adminId,
      isActive: false,
    });

    // Groups with vehicle counts
    const groupsWithCounts = await VehicleGroup.aggregate([
      { $match: { adminId: adminId } },
      {
        $lookup: {
          from: "vehicles",
          localField: "_id",
          foreignField: "groupId",
          as: "vehicles",
        },
      },
      {
        $project: {
          groupName: 1,
          description: 1,
          isActive: 1,
          vehicleCount: { $size: "$vehicles" },
        },
      },
      { $sort: { vehicleCount: -1 } },
    ]);

    const recentGroups = await VehicleGroup.find({ adminId })
      .select("groupName description isActive createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: "success",
      data: {
        totalGroups,
        activeGroups,
        inactiveGroups,
        groupsWithCounts,
        recentGroups,
      },
    });
  } catch (error) {
    console.error("Get vehicle group stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllVehicleGroups,
  getVehicleGroupById,
  createVehicleGroup,
  updateVehicleGroup,
  deleteVehicleGroup,
  toggleVehicleGroupStatus,
  getVehiclesInGroup,
  getVehicleGroupStats,
};
