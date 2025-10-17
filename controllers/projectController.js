const Project = require("../models/projectModel");
const { validationResult } = require("express-validator");

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      type = "",
    } = req.query;
    const adminId = req.admin._id;

    const query = { adminId };

    // Search filter
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { projectName: { $regex: search, $options: "i" } },
        { projectId: { $regex: search, $options: "i" } },
        { place: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .populate("assignedVehicles", "vehicleId registrationNumber make model")
      .populate("assignedDrivers", "driverId firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const project = await Project.findOne({ _id: id, adminId })
      .populate(
        "assignedVehicles",
        "vehicleId registrationNumber make model year"
      )
      .populate("assignedDrivers", "driverId firstName lastName mobile");

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        project,
      },
    });
  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Create new project
const createProject = async (req, res) => {
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
      customerName,
      companyName,
      projectName,
      place,
      type,
      amount,
      startDate,
      endDate,
      description,
    } = req.body;

    const adminId = req.admin._id;

    // Create new project
    const project = new Project({
      customerName,
      companyName,
      projectName,
      place,
      type,
      amount: parseFloat(amount),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description,
      adminId,
    });

    // Generate sequential projectId (PRJ01, PRJ02, etc.)
    try {
      const lastProject = await Project.findOne(
        { projectId: { $regex: /^PRJ\d+$/ } },
        { projectId: 1 },
        { sort: { projectId: -1 } }
      );

      let nextNumber = 1;
      if (lastProject && lastProject.projectId) {
        const lastNumber = parseInt(lastProject.projectId.replace("PRJ", ""));
        nextNumber = lastNumber + 1;
      }

      project.projectId = `PRJ${String(nextNumber).padStart(2, "0")}`;
    } catch (error) {
      console.error("Error generating projectId:", error);
      // Fallback to timestamp-based ID if counting fails
      const timestamp = Date.now().toString().slice(-6);
      project.projectId = `PRJ${timestamp}`;
    }

    await project.save();

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: {
        project: {
          id: project._id,
          projectId: project.projectId,
          customerName: project.customerName,
          companyName: project.companyName,
          projectName: project.projectName,
          place: project.place,
          type: project.type,
          amount: project.amount,
          startDate: project.startDate,
          endDate: project.endDate,
          status: project.status,
          description: project.description,
          duration: project.duration,
          projectStatus: project.projectStatus,
          createdAt: project.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Create project error:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      if (error.keyPattern?.projectId) {
        return res.status(400).json({
          status: "error",
          message: "Project ID already exists. Please try again.",
        });
      }
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "Validation error",
    //     errors: errors.array(),
    //   });
    // }

    const { id } = req.params;
    const adminId = req.admin._id;
    const updateData = req.body;

    const project = await Project.findOne({ _id: id, adminId });
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (key === "startDate" || key === "endDate") {
        project[key] = new Date(updateData[key]);
      } else if (key === "amount") {
        project[key] = parseFloat(updateData[key]);
      } else {
        project[key] = updateData[key];
      }
    });

    await project.save();

    res.status(200).json({
      status: "success",
      message: "Project updated successfully",
      data: {
        project: {
          id: project._id,
          projectId: project.projectId,
          customerName: project.customerName,
          companyName: project.companyName,
          projectName: project.projectName,
          place: project.place,
          type: project.type,
          amount: project.amount,
          startDate: project.startDate,
          endDate: project.endDate,
          status: project.status,
          description: project.description,
          duration: project.duration,
          projectStatus: project.projectStatus,
          updatedAt: project.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const project = await Project.findOne({ _id: id, adminId });
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    await Project.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Toggle project status
const toggleProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const project = await Project.findOne({ _id: id, adminId });
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Toggle between Active and Completed
    project.status = project.status === "Active" ? "Completed" : "Active";
    await project.save();

    res.status(200).json({
      status: "success",
      message: `Project ${project.status.toLowerCase()} successfully`,
      data: {
        project: {
          id: project._id,
          projectId: project.projectId,
          projectName: project.projectName,
          status: project.status,
        },
      },
    });
  } catch (error) {
    console.error("Toggle project status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Assign vehicle to project
const assignVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleId } = req.body;
    const adminId = req.admin._id;

    const project = await Project.findOne({ _id: id, adminId });
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Check if vehicle is already assigned
    if (project.assignedVehicles.includes(vehicleId)) {
      return res.status(400).json({
        status: "error",
        message: "Vehicle already assigned to this project",
      });
    }

    project.assignedVehicles.push(vehicleId);
    await project.save();

    res.status(200).json({
      status: "success",
      message: "Vehicle assigned to project successfully",
      data: {
        project: {
          id: project._id,
          projectId: project.projectId,
          assignedVehicles: project.assignedVehicles,
        },
      },
    });
  } catch (error) {
    console.error("Assign vehicle error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Assign driver to project
const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const adminId = req.admin._id;

    const project = await Project.findOne({ _id: id, adminId });
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Check if driver is already assigned
    if (project.assignedDrivers.includes(driverId)) {
      return res.status(400).json({
        status: "error",
        message: "Driver already assigned to this project",
      });
    }

    project.assignedDrivers.push(driverId);
    await project.save();

    res.status(200).json({
      status: "success",
      message: "Driver assigned to project successfully",
      data: {
        project: {
          id: project._id,
          projectId: project.projectId,
          assignedDrivers: project.assignedDrivers,
        },
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

// Get project statistics
const getProjectStats = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const totalProjects = await Project.countDocuments({ adminId });
    const activeProjects = await Project.countDocuments({
      adminId,
      status: "Active",
    });
    const completedProjects = await Project.countDocuments({
      adminId,
      status: "Completed",
    });
    const onHoldProjects = await Project.countDocuments({
      adminId,
      status: "On Hold",
    });

    const typeStats = await Project.aggregate([
      { $match: { adminId: adminId } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentProjects = await Project.find({ adminId })
      .select("projectId projectName customerName status createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: "success",
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        onHoldProjects,
        typeStats,
        recentProjects,
      },
    });
  } catch (error) {
    console.error("Get project stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  toggleProjectStatus,
  assignVehicle,
  assignDriver,
  getProjectStats,
};
