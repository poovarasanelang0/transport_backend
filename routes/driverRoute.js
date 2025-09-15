const express = require("express");
const { body, query } = require("express-validator");
const driverController = require("../controllers/driverController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const createDriverValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("mobile")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Mobile number must be between 10 and 15 characters"),
  body("licenseNumber")
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("License number must be between 5 and 20 characters"),
  body("licenseExpiry")
    .notEmpty()
    .withMessage("License expiry date is required"),
  body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),
  body("experience")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Experience must be between 0 and 50 years"),
  body("vehicleType")
    .optional()
    .isIn(["Light Vehicle", "Heavy Vehicle", "Bus", "Truck", "All"])
    .withMessage("Invalid vehicle type"),
];

const updateDriverValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("mobile")
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Mobile number must be between 10 and 15 characters"),
  body("licenseNumber")
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("License number must be between 5 and 20 characters"),
  body("licenseExpiry")
    .optional()
    .notEmpty()
    .withMessage("License expiry date cannot be empty"),
  body("dateOfBirth")
    .optional()
    .notEmpty()
    .withMessage("Date of birth cannot be empty"),
  body("experience")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Experience must be between 0 and 50 years"),
  body("vehicleType")
    .optional()
    .isIn(["Light Vehicle", "Heavy Vehicle", "Bus", "Truck", "All"])
    .withMessage("Invalid vehicle type"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive", "On Trip", "On Leave"])
    .withMessage("Invalid status"),
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
    .isIn(["Active", "Inactive", "On Trip", "On Leave"])
    .withMessage("Invalid status"),
  query("vehicleType")
    .optional()
    .isIn(["Light Vehicle", "Heavy Vehicle", "Bus", "Truck", "All"])
    .withMessage("Invalid vehicle type"),
];

// Routes
router.get("/", queryValidation, driverController.getAllDrivers);
router.get("/stats", driverController.getDriverStats);
router.get("/:id", driverController.getDriverById);

// Create driver
router.post("/", driverController.createDriver);

// Update driver
router.put("/:id", updateDriverValidation, driverController.updateDriver);

// Delete driver
router.delete("/:id", driverController.deleteDriver);

// Toggle driver status
router.patch("/:id/toggle-status", driverController.toggleDriverStatus);

module.exports = router;
