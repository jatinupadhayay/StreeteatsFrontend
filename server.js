const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const http = require("http")
require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const vendorRoutes = require("./routes/vendors")
const orderRoutes = require("./routes/orders")
const paymentRoutes = require("./routes/payments")
const uploadRoutes = require("./routes/upload")
const razorpayRoutes = require("./routes/razorpay")

// Import utilities
const { initializeSocket } = require("./utils/socket")
const { testEmailConnection } = require("./utils/emailService")

const app = express()
const server = http.createServer(app)

// Initialize Socket.io
const io = initializeSocket(server)

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Body parsing middleware
app.use("/api/payments/webhook", express.raw({ type: "application/json" }))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB")
    // Test email service
    testEmailConnection()
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err)
    process.exit(1)
  })

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/vendors", vendorRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/razorpay", razorpayRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      socket: io ? "Active" : "Inactive",
    },
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error)

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(error.errors).map((err) => err.message),
    })
  }

  if (error.name === "MulterError") {
    return res.status(400).json({
      message: "File upload error",
      error: error.message,
    })
  }

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    mongoose.connection.close()
    process.exit(0)
  })
})
