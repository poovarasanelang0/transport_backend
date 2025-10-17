const basicAuth = (req, res, next) => {
  // Skip basic auth for health check and welcome
  if (
    req.path === "/health" ||
    req.path === "/api/health" ||
    req.path === "/api/welcome"
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;

  // Debug logging
  console.log("Basic Auth Debug:", {
    path: req.path,
    method: req.method,
    hasAuthHeader: !!authHeader,
    authHeader: authHeader ? authHeader.substring(0, 20) + "..." : "none",
    environment: process.env.NODE_ENV,
  });

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    console.log("Missing or invalid auth header");
    return res.status(401).json({
      status: "error",
      message: "Basic authentication required",
    });
  }

  try {
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

    // Use hardcoded credentials for now to avoid env issues
    const expectedUsername = "poovarasan";
    const expectedPassword = "DAF87DSFDSFDSA98FSADKJE324KJL32HFD7FDSFB24343J49DSF";

    console.log("Basic Auth - Username match:", username === expectedUsername);
    console.log("Basic Auth - Password match:", password === expectedPassword);

    if (username === expectedUsername && password === expectedPassword) {
      console.log("Basic Auth - Success");
      next();
    } else {
      console.log("Basic Auth - Failed");
      return res.status(401).json({
        status: "error",
        message: "Invalid basic authentication credentials",
      });
    }
  } catch (error) {
    console.error("Basic Auth Error:", error);
    return res.status(401).json({
      status: "error",
      message: "Invalid authorization header",
    });
  }
};

module.exports = {
  basicAuth,
};
