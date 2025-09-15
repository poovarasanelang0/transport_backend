const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const adminSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    adminName: {
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
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
    },
    licenseType: {
      type: String,
      enum: ["Basic", "Standard", "Premium"],
      default: "Standard",
    },
    companySize: {
      type: String,
      default: "10-20 Vehicles",
    },
    subscriptionPeriod: {
      type: Number,
      default: 12, // months
    },
    subscriptionEnd: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    settings: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      timezone: { type: String, default: "UTC" },
      language: { type: String, default: "en" },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
adminSchema.index({ email: 1 });
adminSchema.index({ adminId: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ role: 1 });

// Generate adminId and hash password before saving
adminSchema.pre("save", async function (next) {
  // Generate adminId if it doesn't exist
  if (!this.adminId) {
    try {
      const count = await this.constructor.countDocuments();
      this.adminId = "ADM" + String(count + 1).padStart(3, "0");
      // Successfully generated adminId
    } catch (error) {
      // Fallback to timestamp-based ID if counting fails
      this.adminId = "ADM" + String(Date.now()).slice(-6);
    }
  }

  // Hash password if modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
adminSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Method to generate reset password token
adminSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Virtual for subscription status
adminSchema.virtual("subscriptionStatus").get(function () {
  if (this.subscriptionEnd < new Date()) {
    return "expired";
  } else if (
    this.subscriptionEnd < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ) {
    return "expiring_soon";
  } else {
    return "active";
  }
});

// Ensure virtual fields are serialized
adminSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

module.exports = mongoose.model("Admin", adminSchema);
