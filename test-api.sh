#!/bin/bash

# API Testing Script for Transport Backend
# Run this script to test your deployed API

API_BASE="https://transport-backend-nine.vercel.app/api"

echo "🚀 Testing Transport Backend API"
echo "================================"

echo ""
echo "1. Testing Welcome API..."
curl -X GET "$API_BASE/welcome" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "2. Testing Health Check..."
curl -X GET "$API_BASE/health" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "3. Testing Login API (should fail with 401)..."
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "✅ API Testing Complete!"
echo ""
echo "If you see HTTP Status: 200 for welcome and health, your API is working!"
echo "If you see CORS errors, the issue is with CORS configuration."
