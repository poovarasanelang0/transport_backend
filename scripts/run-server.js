const { spawn } = require("child_process");
const { getDefaultCredentials } = require("../config/defaultUsers");

// Start the server
const server = spawn("node", ["server.js"], {
  stdio: "inherit",
  cwd: __dirname + "/..",
});

server.on("error", (error) => {
  process.exit(1);
});

server.on("close", (code) => {
  // Server stopped
});

// Handle process termination
process.on("SIGINT", () => {
  server.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.kill("SIGTERM");
  process.exit(0);
});
