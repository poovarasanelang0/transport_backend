const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: "./config.env" });

// Import database connection
const connectDB = require("./config/database");

// Import routes
const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const driverRoute = require("./routes/driverRoute");
const vehicleRoute = require("./routes/vehicleRoute");
const projectRoute = require("./routes/projectRoute");
const tripRoute = require("./routes/tripRoute");
const vehicleGroupRoute = require("./routes/vehicleGroupRoute");
const reportRoute = require("./routes/reportRoute");

// Import middleware
const { authenticateToken } = require("./middleware/auth");
const { basicAuth } = require("./middleware/basicAuth");

const app = express();

// Security middleware
app.use(helmet());
// CORS configuration - Allow specific origins including your frontend
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://transport-backend-nine.vercel.app",
    "https://transport-frontend-d9cm.vercel.app", // Your frontend domain
    "https://transport-frontend-d9cm.vercel.app/", // With trailing slash
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // Allow requests with no origin (like mobile apps or curl requests)
    res.header("Access-Control-Allow-Origin", "*");
  } else {
    // For development/testing, allow all origins
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin, token, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, user-agent, referer"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "Authorization, token");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Handle preflight OPTIONS requests
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://transport-backend-nine.vercel.app",
    "https://transport-frontend-d9cm.vercel.app",
    "https://transport-frontend-d9cm.vercel.app/",
  ];

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin, token, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, user-agent, referer"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "Authorization, token");
  res.sendStatus(200);
});

// Rate limiting - Intelligent strategy with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requests per minute
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
    retryAfter:
      Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000) || 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    if (
      process.env.NODE_ENV === "development" &&
      (req.ip === "127.0.0.1" ||
        req.ip === "::1" ||
        req.ip === "::ffff:127.0.0.1")
    ) {
      return true;
    }

    // Skip rate limiting for auth endpoints (login, register, etc.)
    if (req.url.startsWith("/api/auth/")) {
      return true;
    }

    // Skip rate limiting for health and welcome endpoints
    if (req.url === "/api/health" || req.url === "/api/welcome") {
      return true;
    }

    return false;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: "error",
      message: "Too many requests from this IP, please try again later.",
      retryAfter:
        Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000) || 60,
    });
  },
});

// Specific rate limiter for auth endpoints (more generous)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 login attempts per 15 minutes
  message: {
    status: "error",
    message: "Too many login attempts, please try again later.",
    retryAfter: 900, // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for localhost in development
    if (
      process.env.NODE_ENV === "development" &&
      (req.ip === "127.0.0.1" ||
        req.ip === "::1" ||
        req.ip === "::ffff:127.0.0.1")
    ) {
      return true;
    }
    return false;
  },
});

// Apply rate limiting based on environment
if (process.env.NODE_ENV === "development") {
  // In development, we still apply auth limiter but with very generous limits
  app.use("/api/auth/", authLimiter);
} else {
  // In production, apply all rate limiting
  app.use("/api/auth/", authLimiter);
  app.use("/api/", generalLimiter);
}

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Debug middleware for development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    next();
  });
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic authentication for all API routes
app.use("/api", basicAuth);

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/admin", authenticateToken, adminRoute);
app.use("/api/driver", authenticateToken, driverRoute);
app.use("/api/vehicle", authenticateToken, vehicleRoute);
app.use("/api/project", authenticateToken, projectRoute);
app.use("/api/trip", authenticateToken, tripRoute);
app.use("/api/vehicle-group", authenticateToken, vehicleGroupRoute);
app.use("/api/report", authenticateToken, reportRoute);

// Welcome endpoint (no authentication required)
app.get("/api/welcome", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Transport Management API!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      welcome: "/api/welcome",
      auth: "/api/auth/login",
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Transport Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// Test Basic Auth endpoint
app.get("/api/test-auth", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Basic Auth is working!",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("/api/*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "API endpoint not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Initialize server
const startServer = async () => {
  try {
    console.log("Starting server...");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Vercel:", process.env.VERCEL);

    // Connect to database
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected successfully");

    // Start server
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
