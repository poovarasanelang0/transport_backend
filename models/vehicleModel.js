const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: false,
      unique: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    vehicleType: {
      type: String,
      enum: ["Light Vehicle", "Heavy Vehicle", "Bus", "Truck", "Van", "SUV"],
      required: true,
    },
    capacity: {
      passengers: {
        type: Number,
        default: 0,
        min: 0,
      },
      cargo: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"],
      required: true,
    },
    transmission: {
      type: String,
      enum: ["Manual", "Automatic"],
      default: "Manual",
    },
    color: {
      type: String,
      trim: true,
    },
    insurance: {
      policyNumber: {
        type: String,
        trim: true,
      },
      provider: {
        type: String,
        trim: true,
      },
      expiryDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    permit: {
      permitNumber: {
        type: String,
        trim: true,
      },
      expiryDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    fitness: {
      certificateNumber: {
        type: String,
        trim: true,
      },
      expiryDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    puc: {
      certificateNumber: {
        type: String,
        trim: true,
      },
      expiryDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Maintenance", "Repair", "Retired"],
      default: "Active",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleGroup",
      default: null,
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

// Indexes
vehicleSchema.index({ registrationNumber: 1 });
vehicleSchema.index({ vehicleId: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ vehicleType: 1 });
vehicleSchema.index({ adminId: 1 });
vehicleSchema.index({ assignedDriver: 1 });
vehicleSchema.index({ groupId: 1 });

// Virtual for vehicle display name
vehicleSchema.virtual("displayName").get(function () {
  return `${this.year} ${this.make} ${this.model} (${this.registrationNumber})`;
});

// Virtual for document expiry status
vehicleSchema.virtual("documentStatus").get(function () {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringDocuments = [];

  if (
    this.insurance?.expiryDate &&
    this.insurance.expiryDate <= thirtyDaysFromNow
  ) {
    expiringDocuments.push("insurance");
  }
  if (this.permit?.expiryDate && this.permit.expiryDate <= thirtyDaysFromNow) {
    expiringDocuments.push("permit");
  }
  if (
    this.fitness?.expiryDate &&
    this.fitness.expiryDate <= thirtyDaysFromNow
  ) {
    expiringDocuments.push("fitness");
  }
  if (this.puc?.expiryDate && this.puc.expiryDate <= thirtyDaysFromNow) {
    expiringDocuments.push("puc");
  }

  return {
    hasExpiringDocuments: expiringDocuments.length > 0,
    expiringDocuments,
  };
});

// Pre-save middleware to generate sequential vehicleId
vehicleSchema.pre("save", async function (next) {
  if (this.isNew && !this.vehicleId) {
    try {
      const count = await this.constructor.countDocuments();
      this.vehicleId = `VEH${String(count + 1).padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating vehicleId:", error);
      // Fallback to timestamp-based ID if counting fails
      this.vehicleId = `VEH${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Pre-save middleware to update availability based on status and driver assignment
vehicleSchema.pre("save", function (next) {
  // If vehicle is assigned to a driver, it's not available
  if (this.assignedDriver) {
    this.isAvailable = false;
  } else if (this.status === "Active") {
    this.isAvailable = true;
  } else {
    this.isAvailable = false;
  }
  next();
});

// Ensure virtual fields are serialized
vehicleSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
