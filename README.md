# Transport Management System - Backend API

A comprehensive Node.js backend API for the Transport Management System with authentication, authorization, and CRUD operations for all management modules.

## Features

- **Dual User System**: Super Admin and Admin with separate panels
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Admin Management**: Complete CRUD operations for admin accounts
- **Driver Management**: Complete driver management system
- **Vehicle Management**: Vehicle tracking and management
- **Security**: Basic authentication, rate limiting, input validation
- **Database**: MongoDB with Mongoose ODM
- **API Documentation**: RESTful API endpoints
- **Error Handling**: Comprehensive error handling and validation

## Project Structure

```
Backend-node/
├── config.env                 # Environment configuration
├── package.json              # Dependencies and scripts
├── server.js                 # Main server file
├── config/                   # Configuration files
│   └── database.js          # Database connection
├── middleware/               # Custom middleware
│   ├── auth.js              # JWT authentication
│   └── basicAuth.js         # Basic authentication
├── models/                   # Database models
│   ├── adminModel.js        # Admin model
│   ├── driverModel.js       # Driver model
│   └── vehicleModel.js      # Vehicle model
├── controllers/              # Business logic
│   ├── authController.js    # Authentication logic
│   ├── adminController.js   # Admin management logic
│   └── driverController.js  # Driver management logic
├── routes/                   # API routes
│   ├── authRoute.js         # Authentication routes
│   ├── adminRoute.js        # Admin management routes
│   ├── driverRoute.js       # Driver management routes
│   ├── vehicleRoute.js      # Vehicle management routes
│   ├── projectRoute.js      # Project management routes
│   ├── tripRoute.js         # Trip management routes
│   └── reportRoute.js       # Report routes
└── uploads/                 # File uploads directory
```

## Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment**:

   - Copy `config.env` and update the values
   - Set up MongoDB connection string
   - Configure JWT secrets
   - Set up email configuration (optional)

3. **Insert default users** (optional):

   ```bash
   npm run insert-default-users
   ```

4. **Start the server**:

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start

   # Run with credentials display
   npm run run-with-credentials
   ```

## Default Login Credentials

To set up default users, run the following command:

```bash
npm run insert-default-users
```

This will create two default users in the database:

### Super Admin

- **Email**: `superadmin@transport.com`
- **Password**: `superadmin123`
- **Role**: `superadmin`
- **Access**: Software Distribution Management panel, can see all admin details

### Admin

- **Email**: `admin@transport.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Access**: Regular transport management panel

**Note**: The script will only create users if they don't already exist in the database.

## Environment Variables

Create a `config.env` file with the following variables:

```env
# Server Configuration
PORT=5002
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/transport_management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Basic Auth Configuration
BASIC_AUTH_USERNAME=poovarasan
BASIC_AUTH_PASSWORD=DAF87DSFDSFDSA98FSADKJE324KJL32HFD7FDSFB24343J49DSF

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication Routes

| Method | Endpoint                   | Description               |
| ------ | -------------------------- | ------------------------- |
| POST   | `/api/auth/login`          | Login admin/super admin   |
| POST   | `/api/auth/register`       | Register new admin        |
| PUT    | `/api/auth/forgotPassword` | Forgot password           |
| PUT    | `/api/auth/resetPassword`  | Reset password            |
| GET    | `/api/auth/profile`        | Get current admin profile |
| PUT    | `/api/auth/profile`        | Update admin profile      |

### Admin Management Routes (Super Admin Only)

| Method | Endpoint                       | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| GET    | `/api/admin`                   | Get all admins (with pagination) |
| GET    | `/api/admin/stats`             | Get admin statistics             |
| GET    | `/api/admin/:id`               | Get admin by ID                  |
| POST   | `/api/admin`                   | Create new admin                 |
| PUT    | `/api/admin/:id`               | Update admin                     |
| DELETE | `/api/admin/:id`               | Delete admin                     |
| PATCH  | `/api/admin/:id/toggle-status` | Toggle admin status              |

### Driver Management Routes

| Method | Endpoint                        | Description                       |
| ------ | ------------------------------- | --------------------------------- |
| GET    | `/api/driver`                   | Get all drivers (with pagination) |
| GET    | `/api/driver/stats`             | Get driver statistics             |
| GET    | `/api/driver/:id`               | Get driver by ID                  |
| POST   | `/api/driver`                   | Create new driver                 |
| PUT    | `/api/driver/:id`               | Update driver                     |
| DELETE | `/api/driver/:id`               | Delete driver                     |
| PATCH  | `/api/driver/:id/toggle-status` | Toggle driver status              |

### Other Management Routes

- **Vehicle Management**: `/api/vehicle/*`
- **Project Management**: `/api/project/*`
- **Trip Management**: `/api/trip/*`
- **Reports**: `/api/report/*`

## User Roles & Access

### Super Admin

- **Software Distribution Management Panel**
- Can view all admin accounts and their details
- Can create, update, delete admin accounts
- Can manage system-wide settings
- Full access to all modules

### Admin

- **Transport Management Panel**
- Can manage their own company's data
- Can manage drivers, vehicles, trips
- Cannot see other admin accounts
- Limited to their own organization

## Authentication

### Basic Authentication

All API requests require Basic Authentication:

```
Authorization: Basic <base64(username:password)>
```

### JWT Authentication

Protected routes require JWT token:

```
token: Bearer <jwt_token>
```

## Request/Response Format

### Success Response

```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Database Models

### Admin Model

- `adminId`: Unique admin identifier
- `companyName`: Company name
- `adminName`: Admin's full name
- `email`: Email address (unique)
- `mobile`: Mobile number
- `password`: Hashed password
- `role`: admin/superadmin
- `licenseType`: Basic/Standard/Premium
- `companySize`: Vehicle count range
- `subscriptionEnd`: Subscription expiry date
- `isActive`: Account status
- `lastLogin`: Last login timestamp

### Driver Model

- `driverId`: Unique driver identifier
- `firstName`, `lastName`: Driver's name
- `email`: Email address (unique)
- `mobile`: Mobile number
- `licenseNumber`: Driver's license number
- `licenseExpiry`: License expiry date
- `dateOfBirth`: Date of birth
- `experience`: Years of experience
- `vehicleType`: Type of vehicle they can drive
- `status`: Active/Inactive/On Trip/On Leave
- `isAvailable`: Availability status
- `adminId`: Reference to admin account

### Vehicle Model

- `vehicleId`: Unique vehicle identifier
- `registrationNumber`: Vehicle registration
- `make`, `model`, `year`: Vehicle details
- `vehicleType`: Type of vehicle
- `fuelType`: Petrol/Diesel/Electric/etc.
- `status`: Active/Inactive/Maintenance/etc.
- `isAvailable`: Availability status
- `adminId`: Reference to admin account

## Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Tokens**: Secure authentication tokens
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Express-validator for request validation
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Basic Auth**: API-level authentication

## Development

### Adding New Models

1. Create model file in `models/` directory (e.g., `userModel.js`)
2. Define schema with validation
3. Add indexes for performance
4. Export the model

### Adding New Controllers

1. Create controller file in `controllers/` directory (e.g., `userController.js`)
2. Implement CRUD operations
3. Add error handling
4. Export controller functions

### Adding New Routes

1. Create route file in `routes/` directory (e.g., `userRoute.js`)
2. Define validation rules
3. Map routes to controller functions
4. Import in `server.js`

## Testing

Test the API endpoints using tools like Postman or curl:

```bash
# Health check
curl http://localhost:5002/api/health

# Login (Super Admin)
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic <base64_credentials>" \
  -d '{"email":"superadmin@transport.com","password":"superadmin123","role":"superadmin"}'

# Login (Admin)
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic <base64_credentials>" \
  -d '{"email":"admin@transport.com","password":"admin123","role":"admin"}'
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure MongoDB Atlas or production database
4. Set up proper logging
5. Configure reverse proxy (nginx)
6. Use PM2 for process management

## License

MIT License
