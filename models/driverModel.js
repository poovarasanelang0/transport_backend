const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: false,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      mobile: String,
    },
    experience: {
      type: Number, // years
      default: 0,
    },
    vehicleType: {
      type: String,
      enum: ["Light Vehicle", "Heavy Vehicle", "Bus", "Truck", "All"],
      default: "Light Vehicle",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "On Trip", "On Leave"],
      default: "Active",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    profileImage: String,
    documents: [
      {
        type: {
          type: String,
          enum: [
            "License",
            "ID Proof",
            "Medical Certificate",
            "Insurance",
            "Other",
          ],
        },
        fileName: String,
        fileUrl: String,
        expiryDate: Date,
        isVerified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
    },
    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
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
driverSchema.index({ email: 1 });
driverSchema.index({ driverId: 1 });
driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ status: 1 });
driverSchema.index({ adminId: 1 });

// Virtual for full name
driverSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for license status
driverSchema.virtual("licenseStatus").get(function () {
  if (this.licenseExpiry < new Date()) {
    return "expired";
  } else if (
    this.licenseExpiry < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ) {
    return "expiring_soon";
  } else {
    return "valid";
  }
});

// Pre-save middleware to generate sequential driverId (disabled to prevent conflicts)
// driverSchema.pre("save", async function (next) {
//   if (this.isNew && !this.driverId) {
//     try {
//       // Get the highest existing driverId number
//       const lastDriver = await this.constructor.findOne(
//         { driverId: { $regex: /^DRV\d+$/ } },
//         { driverId: 1 },
//         { sort: { driverId: -1 } }
//       );

//       let nextNumber = 1;
//       if (lastDriver && lastDriver.driverId) {
//         const lastNumber = parseInt(lastDriver.driverId.replace("DRV", ""));
//         nextNumber = lastNumber + 1;
//       }

//       this.driverId = `DRV${String(nextNumber).padStart(3, "0")}`;
//       console.log(`Generated driverId: ${this.driverId}`);
//     } catch (error) {
//       console.error("Error generating driverId:", error);
//       // Fallback to timestamp-based ID if counting fails
//       this.driverId = `DRV${Date.now().toString().slice(-6)}`;
//     }
//   }
//   next();
// });

// Ensure virtual fields are serialized
driverSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Driver", driverSchema);
