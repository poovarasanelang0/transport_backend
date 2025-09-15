#!/bin/bash

# Quick Deployment Script for Transport Management Backend
# This script helps you deploy to Railway (recommended)

echo "🚀 Transport Management Backend Deployment Script"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if config.env exists
if [ ! -f "config.env" ]; then
    echo "⚠️  config.env not found!"
    echo "📝 Please copy config.prod.env to config.env and update with your values:"
    echo "   cp config.prod.env config.env"
    echo "   # Then edit config.env with your production values"
    exit 1
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Create a GitHub repository"
echo "2. Push your code:"
echo "   git remote add origin https://github.com/yourusername/your-repo-name.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Go to https://railway.app and deploy from GitHub"
echo "4. Add environment variables in Railway dashboard"
echo "5. Your app will be live at https://your-app.railway.app"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Happy deploying!"
