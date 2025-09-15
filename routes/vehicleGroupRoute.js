const express = require("express");
const router = express.Router();
const {
  getAllVehicleGroups,
  getVehicleGroupById,
  createVehicleGroup,
  updateVehicleGroup,
  deleteVehicleGroup,
  toggleVehicleGroupStatus,
  getVehiclesInGroup,
  getVehicleGroupStats,
} = require("../controllers/vehicleGroupController");
const { authenticateToken } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Vehicle group management routes
router.get("/", getAllVehicleGroups);
router.get("/stats", getVehicleGroupStats);
router.get("/:id", getVehicleGroupById);
router.get("/:id/vehicles", getVehiclesInGroup);
router.post("/", createVehicleGroup);
router.put("/:id", updateVehicleGroup);
router.patch("/:id/toggle-status", toggleVehicleGroupStatus);
router.delete("/:id", deleteVehicleGroup);

module.exports = router;
