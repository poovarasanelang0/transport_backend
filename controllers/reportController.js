const Trip = require("../models/tripModel");
const Vehicle = require("../models/vehicleModel");
const Driver = require("../models/driverModel");
const Project = require("../models/projectModel");

// Get vehicle reports with aggregated trip data
const getVehicleReports = async (req, res) => {
  try {
    const { status, date } = req.query;
    const adminId = req.admin._id;

    // Build query
    let query = { adminId };
    if (status) {
      query.status = status;
    }

    // Get vehicles
    const vehicles = await Vehicle.find(query)
      .populate("groupId", "groupName")
      .sort({ createdAt: -1 });

    // Get aggregated trip data for each vehicle
    const vehicleReports = await Promise.all(
      vehicles.map(async (vehicle) => {
        // Build trip query
        let tripQuery = { vehicleId: vehicle._id };
        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          tripQuery.date = { $gte: startDate, $lt: endDate };
        }

        // Get trips for this vehicle
        const trips = await Trip.find(tripQuery)
          .populate("projectId", "amount type")
          .populate("driverId", "firstName lastName");

        // Calculate aggregated data
        const totalTrips = trips.length;
        let totalEarnings = 0;
        let totalAdvance = 0;
        let totalFuelUsed = 0;
        let netEarnings = 0;

        trips.forEach((trip) => {
          const financials = trip.calculateFinancials(trip.projectId);
          totalEarnings += financials.totalAmount;
          totalAdvance += financials.advanceAmount;
          totalFuelUsed += financials.fuelUsed;
          netEarnings += financials.netEarnings;
        });

        return {
          id: vehicle.vehicleId,
          name: vehicle.displayName,
          registrationNo: vehicle.registrationNumber,
          status: vehicle.status,
          totalTrips,
          totalEarnings,
          totalAdvance,
          netEarnings,
          fuelUsed: totalFuelUsed,
          lastService: vehicle.insurance?.expiryDate || null,
          company: vehicle.groupId?.groupName || "No Group",
          vehicleType: vehicle.vehicleType,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
        };
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        vehicles: vehicleReports,
        totalVehicles: vehicleReports.length,
        totalTrips: vehicleReports.reduce((sum, v) => sum + v.totalTrips, 0),
        totalEarnings: vehicleReports.reduce(
          (sum, v) => sum + v.totalEarnings,
          0
        ),
        totalAdvance: vehicleReports.reduce(
          (sum, v) => sum + v.totalAdvance,
          0
        ),
        netEarnings: vehicleReports.reduce((sum, v) => sum + v.netEarnings, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching vehicle reports:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch vehicle reports",
      error: error.message,
    });
  }
};

// Get driver reports with aggregated trip data
const getDriverReports = async (req, res) => {
  try {
    const { status, date } = req.query;
    const adminId = req.admin._id;

    // Build query
    let query = { adminId };
    if (status) {
      query.status = status;
    }

    // Get drivers
    const drivers = await Driver.find(query).sort({ createdAt: -1 });

    // Get aggregated trip data for each driver
    const driverReports = await Promise.all(
      drivers.map(async (driver) => {
        // Build trip query
        let tripQuery = { driverId: driver._id };
        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          tripQuery.date = { $gte: startDate, $lt: endDate };
        }

        // Get trips for this driver
        const trips = await Trip.find(tripQuery)
          .populate("projectId", "amount type")
          .populate("vehicleId", "registrationNumber make model");

        // Calculate aggregated data
        const totalTrips = trips.length;
        let totalEarnings = 0;
        let totalAdvance = 0;
        let totalKm = 0;
        let netEarnings = 0;

        trips.forEach((trip) => {
          const financials = trip.calculateFinancials(trip.projectId);
          totalEarnings += financials.totalAmount;
          totalAdvance += financials.advanceAmount;
          netEarnings += financials.netEarnings;

          // Add to total KM
          if (trip.actualKm || trip.km) {
            totalKm += trip.actualKm || trip.km;
          }
        });

        return {
          id: driver.driverId,
          name: driver.fullName,
          mobile: driver.mobile,
          licenseNo: driver.licenseNumber,
          status: driver.status,
          totalTrips,
          totalEarnings,
          totalAdvance,
          netEarnings,
          totalKm,
          rating: driver.ratings?.average || 0,
          company: "Transport Company", // Default company name
          experience: driver.experience,
          licenseExpiry: driver.licenseExpiry,
        };
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        drivers: driverReports,
        totalDrivers: driverReports.length,
        totalTrips: driverReports.reduce((sum, d) => sum + d.totalTrips, 0),
        totalEarnings: driverReports.reduce(
          (sum, d) => sum + d.totalEarnings,
          0
        ),
        totalAdvance: driverReports.reduce((sum, d) => sum + d.totalAdvance, 0),
        netEarnings: driverReports.reduce((sum, d) => sum + d.netEarnings, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching driver reports:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch driver reports",
      error: error.message,
    });
  }
};

// Get project reports with aggregated trip data
const getProjectReports = async (req, res) => {
  try {
    const { status, date } = req.query;
    const adminId = req.admin._id;

    // Build query
    let query = { adminId };
    if (status) {
      query.status = status;
    }

    // Get projects
    const projects = await Project.find(query).sort({ createdAt: -1 });

    // Get aggregated trip data for each project
    const projectReports = await Promise.all(
      projects.map(async (project) => {
        // Build trip query
        let tripQuery = { projectId: project._id };
        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          tripQuery.date = { $gte: startDate, $lt: endDate };
        }

        // Get trips for this project
        const trips = await Trip.find(tripQuery)
          .populate("vehicleId", "registrationNumber")
          .populate("driverId", "firstName lastName");

        // Calculate aggregated data
        const totalTrips = trips.length;
        let totalEarnings = 0;
        let totalAdvance = 0;
        let totalKm = 0;
        let totalTons = 0;
        let totalDays = 0;
        let netEarnings = 0;

        trips.forEach((trip) => {
          const financials = trip.calculateFinancials(project);
          totalEarnings += financials.totalAmount;
          totalAdvance += financials.advanceAmount;
          netEarnings += financials.netEarnings;

          // Add to totals based on project type
          if (project.type === "KM") {
            totalKm += trip.actualKm || trip.km || 0;
          } else if (project.type === "Metric Ton") {
            totalTons += trip.actualTons || trip.tons || 0;
          } else if (project.type === "Day Rent") {
            totalDays += trip.actualDays || trip.days || 0;
          }
        });

        return {
          id: project.projectId,
          name: project.projectName,
          type: project.type,
          status: project.status,
          totalTrips,
          totalEarnings,
          totalAdvance,
          netEarnings,
          totalKm: project.type === "KM" ? totalKm : null,
          totalTons: project.type === "Metric Ton" ? totalTons : null,
          totalDays: project.type === "Day Rent" ? totalDays : null,
          startDate: project.startDate,
          endDate: project.endDate,
          company: project.companyName,
          customer: project.customerName,
          amount: project.amount,
        };
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        projects: projectReports,
        totalProjects: projectReports.length,
        totalTrips: projectReports.reduce((sum, p) => sum + p.totalTrips, 0),
        totalEarnings: projectReports.reduce(
          (sum, p) => sum + p.totalEarnings,
          0
        ),
        totalAdvance: projectReports.reduce(
          (sum, p) => sum + p.totalAdvance,
          0
        ),
        netEarnings: projectReports.reduce((sum, p) => sum + p.netEarnings, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching project reports:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch project reports",
      error: error.message,
    });
  }
};

// Get trip reports with detailed financial data
const getTripReports = async (req, res) => {
  try {
    const { status, date } = req.query;
    const adminId = req.admin._id;

    // Build query
    let query = { adminId };
    if (status) {
      query.status = status;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    // Get trips with populated data
    const trips = await Trip.find(query)
      .populate("projectId", "projectName type amount customerName companyName")
      .populate("vehicleId", "registrationNumber make model")
      .populate("driverId", "firstName lastName")
      .sort({ date: -1, createdAt: -1 });

    // Transform trips to report format
    const tripReports = trips.map((trip) => {
      const financials = trip.calculateFinancials(trip.projectId);

      return {
        id: trip.tripId,
        projectName: trip.projectId?.projectName || "Unknown Project",
        vehicleName: trip.vehicleId?.registrationNumber || "Unknown Vehicle",
        driverName: trip.driverId
          ? `${trip.driverId.firstName} ${trip.driverId.lastName}`
          : "Unknown Driver",
        date: trip.date,
        status: trip.status,
        totalAmount: financials.totalAmount,
        fuelAmount: financials.fuelAmount,
        advanceAmount: financials.advanceAmount,
        driverAmount: financials.driverAmount,
        netEarnings: financials.netEarnings,
        source: trip.source,
        destination: trip.destination,
        km: trip.actualKm || trip.km,
        tons: trip.actualTons || trip.tons,
        days: trip.actualDays || trip.days,
        fuelUsed: financials.fuelUsed,
        company: trip.projectId?.companyName || "Unknown Company",
        projectType: trip.projectId?.type,
        projectAmount: trip.projectId?.amount,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        trips: tripReports,
        totalTrips: tripReports.length,
        totalEarnings: tripReports.reduce((sum, t) => sum + t.totalAmount, 0),
        totalAdvance: tripReports.reduce((sum, t) => sum + t.advanceAmount, 0),
        netEarnings: tripReports.reduce((sum, t) => sum + t.netEarnings, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching trip reports:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch trip reports",
      error: error.message,
    });
  }
};

// Get overall dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.admin._id;

    // Get counts
    const vehicleCount = await Vehicle.countDocuments({ adminId });
    const driverCount = await Driver.countDocuments({ adminId });
    const projectCount = await Project.countDocuments({ adminId });
    const tripCount = await Trip.countDocuments({ adminId });

    // Get active counts
    const activeVehicleCount = await Vehicle.countDocuments({
      adminId,
      status: "Active",
    });
    const activeDriverCount = await Driver.countDocuments({
      adminId,
      status: "Active",
    });
    const activeProjectCount = await Project.countDocuments({
      adminId,
      status: "Active",
    });
    const completedTripCount = await Trip.countDocuments({
      adminId,
      status: "Completed",
    });

    // Get financial totals from trips
    const trips = await Trip.find({ adminId }).populate(
      "projectId",
      "amount type"
    );

    let totalEarnings = 0;
    let totalAdvance = 0;
    let netEarnings = 0;

    trips.forEach((trip) => {
      const financials = trip.calculateFinancials(trip.projectId);
      totalEarnings += financials.totalAmount;
      totalAdvance += financials.advanceAmount;
      netEarnings += financials.netEarnings;
    });

    res.status(200).json({
      status: "success",
      data: {
        vehicles: {
          total: vehicleCount,
          active: activeVehicleCount,
        },
        drivers: {
          total: driverCount,
          active: activeDriverCount,
        },
        projects: {
          total: projectCount,
          active: activeProjectCount,
        },
        trips: {
          total: tripCount,
          completed: completedTripCount,
        },
        financials: {
          totalEarnings,
          totalAdvance,
          netEarnings,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getVehicleReports,
  getDriverReports,
  getProjectReports,
  getTripReports,
  getDashboardStats,
};
