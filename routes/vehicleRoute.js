const express = require("express");
const { body, query } = require("express-validator");
const vehicleController = require("../controllers/vehicleController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const createVehicleValidation = [
  body("registrationNumber")
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("Registration number must be between 5 and 20 characters"),
  body("make")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Make must be between 2 and 50 characters"),
  body("model")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Model must be between 2 and 50 characters"),
  body("year")
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage("Year must be a valid year"),
  body("vehicleType")
    .isIn(["Light Vehicle", "Heavy Vehicle", "Bus", "Truck", "Van", "SUV"])
    .withMessage("Invalid vehicle type"),
  body("fuelType")
    .isIn(["Petrol", "Diesel", "Electric", "Hybrid", "CNG"])
    .withMessage("Invalid fuel type"),
  body("transmission")
    .optional()
    .isIn(["Manual", "Automatic"])
    .withMessage("Invalid transmission type"),
  body("capacity.passengers")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Passenger capacity must be a non-negative integer"),
  body("capacity.cargo")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Cargo capacity must be a non-negative integer"),
  body("insurance.policyNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Insurance policy number must be less than 100 characters"),
  body("insurance.provider")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Insurance provider must be less than 100 characters"),

  body("permit.permitNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Permit number must be less than 100 characters"),

  body("fitness.certificateNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Fitness certificate number must be less than 100 characters"),

  body("puc.certificateNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("PUC certificate number must be less than 100 characters"),

  body("status")
    .optional()
    .isIn(["Active", "Inactive", "Maintenance", "Repair", "Retired"])
    .withMessage("Invalid status"),
  body("assignedDriver")
    .optional()
    .isMongoId()
    .withMessage("Invalid driver ID"),
];

const updateVehicleValidation = [
  body("registrationNumber")
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("Registration number must be between 5 and 20 characters"),
  body("make")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Make must be between 2 and 50 characters"),
  body("model")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Model must be between 2 and 50 characters"),
  body("year")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage("Year must be a valid year"),
  body("vehicleType")
    .optional()
    .isIn(["Light Vehicle", "Heavy Vehicle", "Bus", "Truck", "Van", "SUV"])
    .withMessage("Invalid vehicle type"),
  body("fuelType")
    .optional()
    .isIn(["Petrol", "Diesel", "Electric", "Hybrid", "CNG"])
    .withMessage("Invalid fuel type"),
  body("transmission")
    .optional()
    .isIn(["Manual", "Automatic"])
    .withMessage("Invalid transmission type"),
  body("capacity.passengers")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Passenger capacity must be a non-negative integer"),
  body("capacity.cargo")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Cargo capacity must be a non-negative integer"),
  body("insurance.policyNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Insurance policy number must be less than 100 characters"),
  body("insurance.provider")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Insurance provider must be less than 100 characters"),

  body("permit.permitNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Permit number must be less than 100 characters"),

  body("fitness.certificateNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Fitness certificate number must be less than 100 characters"),

  body("puc.certificateNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("PUC certificate number must be less than 100 characters"),

  body("status")
    .optional()
    .isIn(["Active", "Inactive", "Maintenance", "Repair", "Retired"])
    .withMessage("Invalid status"),
  body("assignedDriver")
    .optional()
    .isMongoId()
    .withMessage("Invalid driver ID"),
];

const assignDriverValidation = [
  body("driverId").optional().isMongoId().withMessage("Invalid driver ID"),
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
    .isIn(["Active", "Inactive", "Maintenance", "Repair", "Retired"])
    .withMessage("Invalid status"),
  query("vehicleType")
    .optional()
    .isIn(["Light Vehicle", "Heavy Vehicle", "Bus", "Truck", "Van", "SUV"])
    .withMessage("Invalid vehicle type"),
  query("fuelType")
    .optional()
    .isIn(["Petrol", "Diesel", "Electric", "Hybrid", "CNG"])
    .withMessage("Invalid fuel type"),
  query("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be a boolean value"),
];

// Routes
router.get("/", queryValidation, vehicleController.getAllVehicles);
router.get("/stats", vehicleController.getVehicleStats);
router.get("/:id", vehicleController.getVehicleById);

// Create vehicle (temporarily without validation)
router.post("/", vehicleController.createVehicle);

// Update vehicle (temporarily without validation)
router.put("/:id", vehicleController.updateVehicle);

// Delete vehicle
router.delete("/:id", vehicleController.deleteVehicle);

// Toggle vehicle status
router.patch("/:id/toggle-status", vehicleController.toggleVehicleStatus);

// Assign driver to vehicle (temporarily without validation)
router.patch("/:id/assign-driver", vehicleController.assignDriver);

module.exports = router;
