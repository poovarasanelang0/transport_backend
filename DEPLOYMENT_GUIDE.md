# 🚀 Backend Deployment Guide

## Option 1: Railway (Recommended - Easiest)

### Prerequisites

1. GitHub account
2. Railway account (free at railway.app)
3. MongoDB Atlas account (free at mongodb.com/atlas)

### Step 1: Setup MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (choose free tier)
4. Create a database user:
   - Go to Database Access → Add New Database User
   - Username: `transport_admin`
   - Password: Generate a secure password
5. Whitelist IP addresses:
   - Go to Network Access → Add IP Address
   - Add `0.0.0.0/0` (allows all IPs - for Railway)
6. Get connection string:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password

### Step 2: Push to GitHub

1. Initialize git in your Backend-node folder:

   ```bash
   cd Backend-node
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub
3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy on Railway

1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect it's a Node.js app

### Step 4: Configure Environment Variables

In Railway dashboard:

1. Go to your project → Variables tab
2. Add these environment variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/transport_management_prod?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-random
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production-make-it-very-long-and-random
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=your-very-secure-password-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 5: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Get your live URL from Railway dashboard
3. Test your API: `https://your-app.railway.app/api/health`

---

## Option 2: Render (Alternative)

### Steps:

1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Create "New Web Service"
4. Connect your GitHub repository
5. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables (same as Railway)
7. Deploy

---

## Option 3: Heroku (Traditional)

### Steps:

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Add MongoDB Atlas addon: `heroku addons:create mongolab:sandbox`
5. Set environment variables: `heroku config:set NODE_ENV=production`
6. Deploy: `git push heroku main`

---

## Option 4: VPS (DigitalOcean/AWS)

### Steps:

1. Create a VPS instance
2. Install Node.js and MongoDB
3. Clone your repository
4. Install dependencies: `npm install`
5. Setup PM2 for process management
6. Configure Nginx as reverse proxy
7. Setup SSL with Let's Encrypt

---

## 🔧 Post-Deployment Setup

### 1. Test Your API

```bash
# Health check
curl https://your-app-url.com/api/health

# Test authentication
curl -X POST https://your-app-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}'
```

### 2. Update Frontend

Update your frontend API base URL to point to your deployed backend.

### 3. Monitor Your Application

- Check logs in your deployment platform
- Monitor database connections
- Set up error tracking (Sentry)

---

## 🚨 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular security updates

---

## 📞 Support

If you encounter issues:

1. Check the logs in your deployment platform
2. Verify environment variables
3. Test database connection
4. Check CORS settings
