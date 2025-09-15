const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

const authenticateToken = async (req, res, next) => {
  try {
    console.log("=== AUTHENTICATE DEBUG ===");
    console.log("req.headers:", req.headers);
    console.log("req.headers.token:", req.headers["token"]);

    const authHeader = req.headers["token"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    console.log("authHeader:", authHeader);
    console.log("token extracted:", token);

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("=== JWT DEBUG ===");
    console.log("Token:", token);
    console.log("Decoded:", decoded);

    // Check if admin still exists
    const admin = await Admin.findById(decoded.adminId).select("-password");
    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token - admin not found",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated",
      });
    }

    console.log("=== AUTH DEBUG ===");
    console.log("decoded.adminId:", decoded.adminId);
    console.log("admin found:", admin);
    console.log("admin._id:", admin._id);
    console.log("Setting req.admin =", admin);

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired",
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Authentication error",
    });
  }
};

const generateToken = (adminId) => {
  return jwt.sign({ adminId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

module.exports = {
  authenticateToken,
  generateToken,
};
