/*
=== PAYMENT GATEWAY SETUP GUIDE ===

1. STRIPE SETUP (International):
   - Go to https://stripe.com
   - Create account
   - Get API keys from Dashboard > Developers > API keys
   - Copy Secret key to STRIPE_SECRET_KEY
   - Copy Publishable key to STRIPE_PUBLISHABLE_KEY
   - Set up webhook endpoint for /api/payments/webhook

2. RAZORPAY SETUP (India):
   - Go to https://razorpay.com
   - Create account
   - Get API keys from Dashboard > Settings > API Keys
   - Copy Key ID to RAZORPAY_KEY_ID
   - Copy Key Secret to RAZORPAY_KEY_SECRET

3. CLOUDINARY SETUP (Image Upload):
   - Go to https://cloudinary.com
   - Create free account
   - Get credentials from Dashboard
   - Copy Cloud Name, API Key, API Secret

4. EMAIL SETUP (Gmail):
   - Enable 2-factor authentication on Gmail
   - Generate App Password: Google Account > Security > App passwords
   - Use App Password in SMTP_PASS (not your regular password)
*/

// Test your payment setup
const testPaymentSetup = () => {
  console.log("🔧 Payment Gateway Configuration:")
  console.log("Stripe:", process.env.STRIPE_SECRET_KEY ? "✅ Configured" : "❌ Missing")
  console.log("Razorpay:", process.env.RAZORPAY_KEY_ID ? "✅ Configured" : "❌ Missing")
  console.log("Cloudinary:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Configured" : "❌ Missing")
  console.log("Email:", process.env.SMTP_USER ? "✅ Configured" : "❌ Missing")
}

module.exports = { testPaymentSetup }
