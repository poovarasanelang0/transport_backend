const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

const authenticateToken = async (req, res, next) => {
  try {
    // Check for JWT token in the 'token' header first, then fallback to Authorization header
    let token = req.headers["token"];

    // If token header doesn't exist or doesn't start with 'Bearer ', check Authorization header
    if (!token || !token.startsWith("Bearer ")) {
      const authHeader =
        req.headers["authorization"] || req.headers["Authorization"];
      token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    } else {
      // Remove 'Bearer ' prefix from token header
      token = token.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
