const { spawn } = require('child_process');
const { getDefaultCredentials } = require('../config/defaultUsers');

console.log('🚀 Starting Transport Management Backend Server...\n');

// Display default credentials before starting server
const credentials = getDefaultCredentials();
console.log('📋 Default Login Credentials:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('👑 Super Admin:');
console.log(`   Email: ${credentials.superadmin.email}`);
console.log(`   Password: ${credentials.superadmin.password}`);
console.log(`   Role: ${credentials.superadmin.role}`);
console.log('');
console.log('👤 Admin:');
console.log(`   Email: ${credentials.admin.email}`);
console.log(`   Password: ${credentials.admin.password}`);
console.log(`   Role: ${credentials.admin.role}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname + '/..'
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
  process.exit(0);
}); 