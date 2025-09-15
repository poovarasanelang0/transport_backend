const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import the Admin model
const Admin = require('../models/adminModel');

// Default user configurations
const defaultUsers = [
  {
    // Super Admin Configuration
    adminId: 'ADM001',
    companyName: 'Transport Management System',
    adminName: 'Super Administrator',
    email: 'superadmin@transport.com',
    mobile: '+91 9876543210',
    password: 'superadmin123',
    role: 'superadmin',
    licenseType: 'Premium',
    companySize: '50+ Vehicles',
    subscriptionPeriod: 60, // months
    isActive: true,
    emailVerified: true,
    address: {
      street: 'System Headquarters',
      city: 'System City',
      state: 'System State',
      country: 'India',
      zipCode: '000000'
    },
    settings: {
      notifications: {
        email: true,
        sms: true
      },
      timezone: 'Asia/Kolkata',
      language: 'en'
    }
  },
  {
    // Regular Admin Configuration
    adminId: 'ADM002',
    companyName: 'Sample Transport Co.',
    adminName: 'Administrator',
    email: 'admin@transport.com',
    mobile: '+91 9876543211',
    password: 'admin123',
    role: 'admin',
    licenseType: 'Standard',
    companySize: '10-20 Vehicles',
    subscriptionPeriod: 12, // months
    isActive: true,
    emailVerified: true,
    address: {
      street: 'Sample Street',
      city: 'Sample City',
      state: 'Sample State',
      country: 'India',
      zipCode: '123456'
    },
    settings: {
      notifications: {
        email: true,
        sms: false
      },
      timezone: 'Asia/Kolkata',
      language: 'en'
    }
  }
];

// Function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Function to insert default users
const insertDefaultUsers = async () => {
  try {
    console.log('🚀 Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    console.log('\n📋 Default Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Super Admin:');
    console.log('   Email: superadmin@transport.com');
    console.log('   Password: superadmin123');
    console.log('   Role: superadmin');
    console.log('');
    console.log('👤 Admin:');
    console.log('   Email: admin@transport.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await Admin.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user object with hashed password
      const userToInsert = {
        ...userData,
        password: hashedPassword,
        subscriptionEnd: new Date(Date.now() + userData.subscriptionPeriod * 30 * 24 * 60 * 60 * 1000)
      };
      
      // Insert user
      const newUser = new Admin(userToInsert);
      await newUser.save();
      
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      insertedCount++;
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Users created: ${insertedCount}`);
    console.log(`   ⏭️  Users skipped: ${skippedCount}`);
    console.log(`   📝 Total processed: ${insertedCount + skippedCount}`);
    
    if (insertedCount > 0) {
      console.log('\n🎉 Default users inserted successfully!');
      console.log('💡 You can now use these credentials to login to the system.');
    } else {
      console.log('\nℹ️  All default users already exist in the database.');
    }
    
  } catch (error) {
    console.error('❌ Error inserting default users:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  insertDefaultUsers();
}

module.exports = { insertDefaultUsers, defaultUsers }; 