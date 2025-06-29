#!/bin/bash

echo "🚀 Quick Deployment Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project directory?"
    exit 1
fi

# Step 1: Clean
echo "🧹 Step 1: Cleaning..."
rm -rf .vercel .next node_modules *.lock

# Step 2: Install
echo "📦 Step 2: Installing dependencies..."
npm install

# Step 3: Build test
echo "🔨 Step 3: Testing build..."
if npm run build; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

# Step 4: Deploy
echo "🚀 Step 4: Deploying to Vercel..."
npx vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo "Check your Vercel dashboard for the live URL."
