const basicAuth = (req, res, next) => {
  try {
    // Skip basic auth for health check
    if (req.path === "/health" || req.path === "/api/health") {
      return next();
    }

    const authHeader = req.headers.authorization;

    // Debug logging for production
    console.log("Basic Auth Debug:", {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!authHeader,
      authHeader: authHeader ? authHeader.substring(0, 20) + "..." : "none",
      envUsername: process.env.BASIC_AUTH_USERNAME,
      envPassword: process.env.BASIC_AUTH_PASSWORD ? "***" : "undefined",
      allHeaders: Object.keys(req.headers)
    });

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      console.log("Missing or invalid auth header");
      return res.status(401).json({
        status: "error",
        message: "Basic authentication required",
      });
    }

    const base64Credentials = authHeader.split(" ")[1];
    if (!base64Credentials) {
      console.log("No base64 credentials found");
      return res.status(401).json({
        status: "error",
        message: "Invalid authorization header format",
      });
    }

    const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
    const [username, password] = credentials.split(":");

    if (!username || !password) {
      console.log("Invalid credentials format");
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials format",
      });
    }

    const expectedUsername = process.env.BASIC_AUTH_USERNAME || "poovarasan";
    const expectedPassword =
      process.env.BASIC_AUTH_PASSWORD ||
      "DAF87DSFDSFDSA98FSADKJE324KJL32HFD7FDSFB24343J49DSF";

    console.log("Comparing credentials:", {
      receivedUsername: username,
      expectedUsername: expectedUsername,
      receivedPassword: password.substring(0, 5) + "...",
      expectedPassword: expectedPassword.substring(0, 5) + "...",
      usernameMatch: username === expectedUsername,
      passwordMatch: password === expectedPassword
    });

    if (username === expectedUsername && password === expectedPassword) {
      console.log("Basic Auth successful");
      next();
    } else {
      console.log("Basic Auth failed - credentials don't match");
      return res.status(401).json({
        status: "error",
        message: "Invalid basic authentication credentials",
      });
    }
  } catch (error) {
    console.error("Basic Auth Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Authentication error",
    });
  }
};

module.exports = {
  basicAuth,
};
