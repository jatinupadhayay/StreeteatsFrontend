const express = require("express")
const Razorpay = require("razorpay")
const crypto = require("crypto")
const auth = require("../middleware/auth")
const router = express.Router()

// Initialize Razorpay (server-side only)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Get Razorpay config (only public key)
router.get("/config", async (req, res) => {
  try {
    res.json({
      key: process.env.RAZORPAY_KEY_ID, // Only public key, not secret
      currency: "INR",
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to get payment config" })
  }
})

// Create payment order
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount, orderId, currency = "INR" } = req.body

    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: orderId,
      payment_capture: 1,
    }

    const order = await razorpay.orders.create(options)

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID, // Only public key
    })
  } catch (error) {
    console.error("Payment order creation failed:", error)
    res.status(500).json({ error: "Failed to create payment order" })
  }
})

// Verify payment
router.post("/verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature === razorpay_signature) {
      // Payment verified successfully
      // Update order status in database
      // Send confirmation emails, etc.

      res.json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
      })
    } else {
      res.status(400).json({ error: "Invalid payment signature" })
    }
  } catch (error) {
    console.error("Payment verification failed:", error)
    res.status(500).json({ error: "Payment verification failed" })
  }
})

module.exports = router
