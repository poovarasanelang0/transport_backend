const basicAuth = (req, res, next) => {
  // Skip basic auth for health check
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({
      status: "error",
      message: "Basic authentication required",
    });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [username, password] = credentials.split(":");

  const expectedUsername = process.env.BASIC_AUTH_USERNAME || "poovarasan";
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD || "DAF87DSFDSFDSA98FSADKJE324KJL32HFD7FDSFB24343J49DSF";

  if (username === expectedUsername && password === expectedPassword) {
    next();
  } else {
    return res.status(401).json({
      status: "error",
      message: "Invalid basic authentication credentials",
    });
  }
};

module.exports = {
  basicAuth,
};
