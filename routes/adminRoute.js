const express = require("express");
const { body, query } = require("express-validator");
const adminController = require("../controllers/adminController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const createAdminValidation = [
  body("companyName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("adminName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Admin name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("mobile")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Mobile number must be between 10 and 15 characters"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("licenseType")
    .optional()
    .isIn(["Basic", "Standard", "Premium"])
    .withMessage("License type must be Basic, Standard, or Premium"),
  body("companySize")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Company size must be between 1 and 100 characters"),
  body("subscriptionPeriod")
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage("Subscription period must be between 1 and 60 months"),
  body("role")
    .optional()
    .isIn(["admin", "superadmin"])
    .withMessage("Role must be either admin or superadmin"),
];

const updateAdminValidation = [
  body("companyName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("adminName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Admin name must be between 2 and 50 characters"),
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
  body("licenseType")
    .optional()
    .isIn(["Basic", "Standard", "Premium"])
    .withMessage("License type must be Basic, Standard, or Premium"),
  body("companySize")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Company size must be between 1 and 100 characters"),
  body("subscriptionPeriod")
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage("Subscription period must be between 1 and 60 months"),
  body("role")
    .optional()
    .isIn(["admin", "superadmin"])
    .withMessage("Role must be either admin or superadmin"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
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
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),
  query("licenseType")
    .optional()
    .isIn(["Basic", "Standard", "Premium"])
    .withMessage("License type must be Basic, Standard, or Premium"),
];

// Routes
router.get("/", queryValidation, adminController.getAllAdmins);
router.get("/stats", adminController.getAdminStats);
router.get("/:id", adminController.getAdminById);

// Create admin (super admin only)
router.post("/", createAdminValidation, adminController.createAdmin);

// Update admin
router.put("/:id", updateAdminValidation, adminController.updateAdmin);

// Delete admin
router.delete("/:id", adminController.deleteAdmin);

// Toggle admin status
router.patch("/:id/toggle-status", adminController.toggleAdminStatus);

// Forgot password routes
router.post("/forgot-password", adminController.forgotPassword);
router.post("/reset-password", adminController.resetPassword);

// Direct password reset (admin only)
router.post("/:id/reset-password", adminController.directPasswordReset);

module.exports = router;
