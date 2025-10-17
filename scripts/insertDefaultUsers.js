const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// npm run insert-default-users
// Load environment variables
dotenv.config({ path: "./config.env" });

// Import the Admin model
const Admin = require("../models/adminModel");

// Default user configurations
const defaultUsers = [
  {
    // Super Admin Configuration
    adminId: "ADM001",
    companyName: "Transport Management System",
    adminName: "Super Administrator",
    email: "superadmin@transport.com",
    mobile: "+91 9876543210",
    password: "superadmin123",
    role: "superadmin",
    licenseType: "Premium",
    companySize: "50+ Vehicles",
    subscriptionPeriod: 60, // months
    isActive: true,
    emailVerified: true,
    address: {
      street: "System Headquarters",
      city: "System City",
      state: "System State",
      country: "India",
      zipCode: "000000",
    },
    settings: {
      notifications: {
        email: true,
        sms: true,
      },
      timezone: "Asia/Kolkata",
      language: "en",
    },
  },
  {
    // Regular Admin Configuration
    adminId: "ADM002",
    companyName: "Sample Transport Co.",
    adminName: "Administrator",
    email: "admin@transport.com",
    mobile: "+91 9876543211",
    password: "admin123",
    role: "admin",
    licenseType: "Standard",
    companySize: "10-20 Vehicles",
    subscriptionPeriod: 12, // months
    isActive: true,
    emailVerified: true,
    address: {
      street: "Sample Street",
      city: "Sample City",
      state: "Sample State",
      country: "India",
      zipCode: "123456",
    },
    settings: {
      notifications: {
        email: true,
        sms: false,
      },
      timezone: "Asia/Kolkata",
      language: "en",
    },
  },
  {
    // Test Admin Configuration
    adminId: "ADM003",
    companyName: "Test Transport Ltd.",
    adminName: "Test Administrator",
    email: "test@transport.com",
    mobile: "+91 9876543212",
    password: "test123",
    role: "admin",
    licenseType: "Basic",
    companySize: "1-10 Vehicles",
    subscriptionPeriod: 6, // months
    isActive: true,
    emailVerified: true,
    address: {
      street: "Test Street",
      city: "Test City",
      state: "Test State",
      country: "India",
      zipCode: "654321",
    },
    settings: {
      notifications: {
        email: false,
        sms: true,
      },
      timezone: "Asia/Kolkata",
      language: "en",
    },
  },
];

// Function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Function to insert or update default users
const insertDefaultUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    let insertedCount = 0;
    let updatedCount = 0;

    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await Admin.findOne({ email: userData.email });

      // Calculate subscription end date
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(
        subscriptionEnd.getMonth() + userData.subscriptionPeriod
      );

      if (existingUser) {
        // User exists, update with new data
        console.log(`Updating existing user: ${userData.email}`);

        // Update fields on existing user object
        Object.keys(userData).forEach((key) => {
          if (key !== "_id" && userData[key] !== undefined) {
            existingUser[key] = userData[key];
          }
        });

        // Update subscription end
        existingUser.subscriptionEnd = subscriptionEnd;

        // Save the user (this will trigger password hashing if password was modified)
        await existingUser.save();

        updatedCount++;
        console.log(`✅ Updated user: ${userData.email}`);
      } else {
        // User doesn't exist, create new user
        console.log(`Creating new user: ${userData.email}`);

        // Create user object (password will be hashed by the model's pre-save hook)
        const userToInsert = {
          ...userData,
          subscriptionEnd: subscriptionEnd,
        };

        // Insert user (password will be automatically hashed by the model's pre-save hook)
        const newUser = new Admin(userToInsert);
        await newUser.save();

        insertedCount++;
        console.log(`✅ Created new user: ${userData.email}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`- New users created: ${insertedCount}`);
    console.log(`- Existing users updated: ${updatedCount}`);
    console.log(`- Total processed: ${insertedCount + updatedCount}`);
  } catch (error) {
    console.error("❌ Error processing users:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  insertDefaultUsers();
}

module.exports = { insertDefaultUsers, defaultUsers };
