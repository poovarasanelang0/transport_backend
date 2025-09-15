const express = require("express");
const { body, query } = require("express-validator");
const projectController = require("../controllers/projectController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const createProjectValidation = [
  body("customerName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Customer name must be between 2 and 100 characters"),
  body("companyName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("projectName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Project name must be between 2 and 100 characters"),
  body("place")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Place must be between 2 and 100 characters"),
  body("type")
    .isIn(["KM", "Metric Ton", "Day Rent"])
    .withMessage("Invalid project type"),
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("startDate").notEmpty().withMessage("Start date is required"),
  body("endDate").notEmpty().withMessage("End date is required"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
];

const updateProjectValidation = [
  body("customerName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Customer name must be between 2 and 100 characters"),
  body("companyName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("projectName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Project name must be between 2 and 100 characters"),
  body("place")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Place must be between 2 and 100 characters"),
  body("type")
    .optional()
    .isIn(["KM", "Metric Ton", "Day Rent"])
    .withMessage("Invalid project type"),
  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("startDate")
    .optional()
    .notEmpty()
    .withMessage("Start date cannot be empty"),
  body("endDate").optional().notEmpty().withMessage("End date cannot be empty"),
  body("status")
    .optional()
    .isIn(["Active", "Completed", "On Hold", "Cancelled"])
    .withMessage("Invalid status"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
];

const assignVehicleValidation = [
  body("vehicleId").notEmpty().withMessage("Vehicle ID is required"),
];

const assignDriverValidation = [
  body("driverId").notEmpty().withMessage("Driver ID is required"),
];

const queryValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),
  query("status")
    .optional()
    .isIn(["Active", "Completed", "On Hold", "Cancelled"])
    .withMessage("Invalid status"),
  query("type")
    .optional()
    .isIn(["KM", "Metric Ton", "Day Rent"])
    .withMessage("Invalid project type"),
];

// Routes
router.get("/", projectController.getAllProjects);
router.get("/stats", projectController.getProjectStats);
router.get("/:id", projectController.getProjectById);

// Create project
router.post("/", projectController.createProject);

// Update project
router.put("/:id", projectController.updateProject);

// Delete project
router.delete("/:id", projectController.deleteProject);

// Toggle project status
router.patch("/:id/toggle-status", projectController.toggleProjectStatus);

// Assign vehicle to project
router.patch("/:id/assign-vehicle", projectController.assignVehicle);

// Assign driver to project
router.patch("/:id/assign-driver", projectController.assignDriver);

module.exports = router;
