const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Vendor = require("../models/Vendor")
const DeliveryPartner = require("../models/DeliveryPartner")
const { sendWelcomeEmail, sendVendorApprovalEmail } = require("../utils/emailService")
const upload = require("../middleware/upload")

const router = express.Router()

// CUSTOMER REGISTRATION
router.post("/register/customer", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create customer
    const customer = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: "customer",
      isVerified: false,
    })

    await customer.save()

    // Send welcome email
    await sendWelcomeEmail(email, name, "customer")

    // Generate JWT token
    const token = jwt.sign({ userId: customer._id, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.status(201).json({
      message: "Customer registered successfully",
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: "customer",
      },
    })
  } catch (error) {
    console.error("Customer registration error:", error)
    res.status(500).json({ message: "Registration failed", error: error.message })
  }
})

// VENDOR REGISTRATION
router.post(
  "/register/vendor",
  upload.fields([
    { name: "shopImage", maxCount: 1 },
    { name: "licenseDocument", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        // Owner Details
        ownerName,
        email,
        password,
        phone,
        // Shop Details
        shopName,
        shopDescription,
        cuisine,
        address,
        // Business Details
        licenseNumber,
        gstNumber,
        bankAccount,
        ifscCode,
        // Operational Details
        openingTime,
        closingTime,
        deliveryRadius,
      } = req.body

      // Check if vendor already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "Vendor already exists with this email" })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user account for vendor
      const vendorUser = new User({
        name: ownerName,
        email,
        password: hashedPassword,
        phone,
        role: "vendor",
        isVerified: false,
      })

      await vendorUser.save()

      // Handle file uploads
      const shopImage = req.files?.shopImage?.[0]?.path || null
      const licenseDocument = req.files?.licenseDocument?.[0]?.path || null
      const ownerPhoto = req.files?.ownerPhoto?.[0]?.path || null

      // Create vendor profile
      const vendor = new Vendor({
        userId: vendorUser._id,
        ownerName,
        shopName,
        shopDescription,
        cuisine: cuisine.split(",").map((c) => c.trim()),
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          coordinates: address.coordinates || [0, 0],
        },
        contact: {
          phone,
          email,
        },
        businessDetails: {
          licenseNumber,
          gstNumber,
          bankAccount,
          ifscCode,
        },
        operationalHours: {
          opening: openingTime,
          closing: closingTime,
        },
        deliveryRadius: Number.parseInt(deliveryRadius),
        images: {
          shop: shopImage,
          license: licenseDocument,
          owner: ownerPhoto,
        },
        status: "pending", // Needs admin approval
        isActive: false,
      })

      await vendor.save()

      // Send approval email to admin and welcome email to vendor
      await sendVendorApprovalEmail(vendor)
      await sendWelcomeEmail(email, ownerName, "vendor")

      res.status(201).json({
        message: "Vendor registration submitted successfully. Awaiting admin approval.",
        vendorId: vendor._id,
        status: "pending",
      })
    } catch (error) {
      console.error("Vendor registration error:", error)
      res.status(500).json({ message: "Vendor registration failed", error: error.message })
    }
  },
)

// DELIVERY PARTNER REGISTRATION
router.post(
  "/register/delivery",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "licensePhoto", maxCount: 1 },
    { name: "aadharCard", maxCount: 1 },
    { name: "vehicleRC", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        // Personal Details
        name,
        email,
        password,
        phone,
        address,
        dateOfBirth,
        // Vehicle Details
        vehicleType,
        vehicleNumber,
        vehicleBrand,
        // Documents
        licenseNumber,
        aadharNumber,
        // Bank Details
        bankAccount,
        ifscCode,
        // Availability
        workingHours,
        preferredAreas,
      } = req.body

      // Check if delivery partner already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "Delivery partner already exists with this email" })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user account
      const deliveryUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        role: "delivery",
        isVerified: false,
      })

      await deliveryUser.save()

      // Handle file uploads
      const profilePhoto = req.files?.profilePhoto?.[0]?.path || null
      const licensePhoto = req.files?.licensePhoto?.[0]?.path || null
      const aadharCard = req.files?.aadharCard?.[0]?.path || null
      const vehicleRC = req.files?.vehicleRC?.[0]?.path || null

      // Create delivery partner profile
      const deliveryPartner = new DeliveryPartner({
        userId: deliveryUser._id,
        personalDetails: {
          name,
          phone,
          email,
          address,
          dateOfBirth: new Date(dateOfBirth),
        },
        vehicleDetails: {
          type: vehicleType,
          number: vehicleNumber,
          brand: vehicleBrand,
        },
        documents: {
          licenseNumber,
          aadharNumber,
          profilePhoto,
          licensePhoto,
          aadharCard,
          vehicleRC,
        },
        bankDetails: {
          accountNumber: bankAccount,
          ifscCode,
        },
        availability: {
          workingHours: workingHours.split(",").map((h) => h.trim()),
          preferredAreas: preferredAreas.split(",").map((a) => a.trim()),
        },
        status: "pending", // Needs verification
        isActive: false,
        currentLocation: {
          coordinates: [0, 0],
        },
      })

      await deliveryPartner.save()

      // Send welcome email
      await sendWelcomeEmail(email, name, "delivery")

      res.status(201).json({
        message: "Delivery partner registration submitted successfully. Awaiting verification.",
        deliveryPartnerId: deliveryPartner._id,
        status: "pending",
      })
    } catch (error) {
      console.error("Delivery partner registration error:", error)
      res.status(500).json({ message: "Delivery partner registration failed", error: error.message })
    }
  },
)

// LOGIN (Updated to handle all roles)
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body

    // Find user
    const user = await User.findOne({ email, role })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check if account is verified/approved
    if (role === "vendor") {
      const vendor = await Vendor.findOne({ userId: user._id })
      if (vendor && vendor.status !== "approved") {
        return res.status(403).json({
          message: "Your vendor account is still pending approval",
          status: vendor.status,
        })
      }
    }

    if (role === "delivery") {
      const deliveryPartner = await DeliveryPartner.findOne({ userId: user._id })
      if (deliveryPartner && deliveryPartner.status !== "approved") {
        return res.status(403).json({
          message: "Your delivery partner account is still under verification",
          status: deliveryPartner.status,
        })
      }
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Login failed", error: error.message })
  }
})

module.exports = router
