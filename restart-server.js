#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

// Kill any existing node processes on port 5002
const killProcess = spawn("npx", ["kill-port", "5002"], {
  stdio: "inherit",
  shell: true,
});

killProcess.on("close", (code) => {
  // Start the server
  const serverProcess = spawn("node", ["server.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  serverProcess.on("close", (code) => {
    // Server process exited
  });

  serverProcess.on("error", (err) => {
    // Failed to start server
  });
});

killProcess.on("error", (err) => {
  // Try to start server anyway
  const serverProcess = spawn("node", ["server.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });
});
