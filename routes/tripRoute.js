const express = require("express");
const router = express.Router();
const {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  updateTripStatus,
  getTripStats,
} = require("../controllers/tripController");
const { authenticateToken } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Trip management routes
router.get("/", getAllTrips);
router.get("/stats", getTripStats);
router.get("/:id", getTripById);
router.post("/", createTrip);
router.put("/:id", updateTrip);
router.patch("/:id/status", updateTripStatus);
router.delete("/:id", deleteTrip);

module.exports = router;
