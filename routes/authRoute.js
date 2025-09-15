const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const registerValidation = [
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
    .isIn(["1-10 Vehicles", "10-20 Vehicles", "20-50 Vehicles", "50+ Vehicles"])
    .withMessage("Invalid company size"),
  body("subscriptionPeriod")
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage("Subscription period must be between 1 and 60 months"),
  body("role")
    .optional()
    .isIn(["admin", "superadmin"])
    .withMessage("Role must be either admin or superadmin"),
];

const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const updateProfileValidation = [
  body("adminName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Admin name must be between 2 and 50 characters"),
  body("mobile")
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Mobile number must be between 10 and 15 characters"),
];

// Routes
router.post("/login", loginValidation, authController.loginAdmin);
router.post("/register", registerValidation, authController.registerAdmin);
router.put(
  "/forgotPassword",
  forgotPasswordValidation,
  authController.forgotPassword
);
router.put(
  "/resetPassword",
  resetPasswordValidation,
  authController.resetPassword
);

// Protected routes
router.get("/profile", authenticateToken, authController.getProfile);
router.put(
  "/profile",
  authenticateToken,
  updateProfileValidation,
  authController.updateProfile
);

module.exports = router;
