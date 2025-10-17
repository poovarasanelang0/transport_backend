const basicAuth = (req, res, next) => {
  // Skip basic auth for health check
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  const authHeader = req.headers.authorization;

  // Simple debug logging
  console.log("Basic Auth - Path:", req.path);
  console.log("Basic Auth - Has Header:", !!authHeader);

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({
      status: "error",
      message: "Basic authentication required",
    });
  }

  try {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    const [username, password] = credentials.split(":");

    // Use hardcoded credentials for now to avoid env issues
    const expectedUsername = "poovarasan";
    const expectedPassword =
      "DAF87DSFDSFDSA98FSADKJE324KJL32HFD7FDSFB24343J49DSF";

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
