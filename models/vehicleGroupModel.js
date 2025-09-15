const mongoose = require("mongoose");

const vehicleGroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
vehicleGroupSchema.index({ adminId: 1, groupName: 1 });
vehicleGroupSchema.index({ isActive: 1 });

// Virtual for vehicle count in this group
vehicleGroupSchema.virtual("vehicleCount", {
  ref: "Vehicle",
  localField: "_id",
  foreignField: "groupId",
  count: true,
});

// Ensure virtual fields are serialized
vehicleGroupSchema.set("toJSON", { virtuals: true });
vehicleGroupSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("VehicleGroup", vehicleGroupSchema);
