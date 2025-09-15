const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: false,
      unique: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    place: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["KM", "Metric Ton", "Day Rent"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "On Hold", "Cancelled"],
      default: "Active",
    },
    description: {
      type: String,
      trim: true,
    },
    assignedVehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
      },
    ],
    assignedDrivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
      },
    ],
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
projectSchema.index({ projectId: 1 });
projectSchema.index({ customerName: 1 });
projectSchema.index({ companyName: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ adminId: 1 });

// Virtual for project duration
projectSchema.virtual("duration").get(function () {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return 0;
});

// Virtual for project status based on dates
projectSchema.virtual("projectStatus").get(function () {
  const now = new Date();
  if (this.endDate < now) {
    return "Completed";
  } else if (this.startDate > now) {
    return "Upcoming";
  } else {
    return "Active";
  }
});

// Pre-save middleware to generate sequential projectId - DISABLED
// projectSchema.pre("save", async function (next) {
//   if (this.isNew && !this.projectId) {
//     try {
//       // Get the highest existing projectId number
//       const lastProject = await this.constructor.findOne(
//         { projectId: { $regex: /^PRJ\d+$/ } },
//         { projectId: 1 },
//         { sort: { projectId: -1 } }
//       );

//       let nextNumber = 1;
//       if (lastProject && lastProject.projectId) {
//         const lastNumber = parseInt(lastProject.projectId.replace("PRJ", ""));
//         nextNumber = lastNumber + 1;
//       }

//       this.projectId = `PRJ${String(nextNumber).padStart(3, "0")}`;
//       console.log(`Generated projectId: ${this.projectId}`);
//     } catch (error) {
//       console.error("Error generating projectId:", error);
//       // Fallback to timestamp-based ID if counting fails
//       this.projectId = `PRJ${Date.now().toString().slice(-6)}`;
//     }
//   }
//   next();
// });

// Ensure virtual fields are serialized
projectSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Project", projectSchema);
