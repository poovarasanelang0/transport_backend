const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      unique: true,
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    // Type-specific fields
    km: {
      type: Number,
      default: null,
    },
    tons: {
      type: Number,
      default: null,
    },
    days: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["Upcoming", "On Process", "Completed", "Cancelled"],
      default: "Upcoming",
    },
    fuelAdvance: {
      type: Number,
      required: true,
    },
    // Additional fields
    actualKm: {
      type: Number,
      default: null,
    },
    actualTons: {
      type: Number,
      default: null,
    },
    actualDays: {
      type: Number,
      default: null,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
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
tripSchema.index({ adminId: 1, date: -1 });
tripSchema.index({ projectId: 1 });
tripSchema.index({ vehicleId: 1 });
tripSchema.index({ driverId: 1 });
tripSchema.index({ status: 1 });

// Virtual for trip type based on project type
tripSchema.virtual("tripType").get(function () {
  if (this.km !== null) return "KM";
  if (this.tons !== null) return "Metric Ton";
  if (this.days !== null) return "Day Rent";
  return "Unknown";
});

// Virtual for trip value display
tripSchema.virtual("tripValue").get(function () {
  if (this.km !== null) return `${this.km} KM`;
  if (this.tons !== null) return `${this.tons} Tons`;
  if (this.days !== null) return `${this.days} Days`;
  return "N/A";
});

// Virtual for financial calculations
tripSchema.virtual("financials", {
  ref: "Project",
  localField: "projectId",
  foreignField: "_id",
  justOne: true,
  options: { select: "amount type" },
});

// Method to calculate financials
tripSchema.methods.calculateFinancials = function (project) {
  if (!project || !project.amount) {
    return {
      totalAmount: 0,
      fuelAmount: 0,
      advanceAmount: 0,
      driverAmount: 0,
      netEarnings: 0,
      projectRate: 0,
      actualValue: 0,
      fuelUsed: 0,
      fuelCostPerLiter: 80,
    };
  }

  const projectAmount = project.amount;
  let totalAmount = 0;
  let actualValue = 0;

  // Calculate total amount based on project type and actual values
  if (project.type === "KM") {
    // Use actual KM if available, otherwise use planned KM
    actualValue = this.actualKm || this.km || 0;
    totalAmount = projectAmount * actualValue;
  } else if (project.type === "Metric Ton") {
    // Use actual tons if available, otherwise use planned tons
    actualValue = this.actualTons || this.tons || 0;
    totalAmount = projectAmount * actualValue;
  } else if (project.type === "Day Rent") {
    // Use actual days if available, otherwise use planned days
    actualValue = this.actualDays || this.days || 0;
    totalAmount = projectAmount * actualValue;
  }

  // Calculate fuel cost (₹80 per liter - current diesel price)
  const fuelCostPerLiter = 80;
  const fuelUsed = this.fuelAdvance || 0; // Fuel advance in liters
  const fuelAmount = fuelUsed * fuelCostPerLiter;

  // Calculate advance amount (typically 30-40% of total)
  const advanceAmount = totalAmount * 0.35;

  // Calculate driver amount (typically 15-25% of total)
  const driverAmount = totalAmount * 0.2;

  // Calculate net earnings
  const netEarnings = totalAmount - fuelAmount - advanceAmount - driverAmount;

  return {
    totalAmount,
    fuelAmount,
    advanceAmount,
    driverAmount,
    netEarnings,
    projectRate: projectAmount,
    actualValue,
    fuelUsed,
    fuelCostPerLiter,
  };
};

// Ensure virtual fields are serialized
tripSchema.set("toJSON", { virtuals: true });
tripSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Trip", tripSchema);
