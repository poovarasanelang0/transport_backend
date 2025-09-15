const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getVehicleReports,
  getDriverReports,
  getProjectReports,
  getTripReports,
  getDashboardStats,
} = require("../controllers/reportController");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Dashboard statistics
router.get("/dashboard", getDashboardStats);

// Vehicle reports
router.get("/vehicles", getVehicleReports);

// Driver reports
router.get("/drivers", getDriverReports);

// Project reports
router.get("/projects", getProjectReports);

// Trip reports
router.get("/trips", getTripReports);

module.exports = router;
