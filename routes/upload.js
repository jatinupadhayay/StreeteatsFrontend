const express = require("express")
const auth = require("../middleware/auth")
const { profileUpload, menuUpload, vendorUpload, deleteImage, extractPublicId } = require("../middleware/upload")
const User = require("../models/User")
const Vendor = require("../models/Vendor")

const router = express.Router()

// Upload profile picture
router.post("/profile", auth, profileUpload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // Delete old profile picture if exists
    const user = await User.findById(req.user.id)
    if (user.profilePicture) {
      const oldPublicId = extractPublicId(user.profilePicture)
      await deleteImage(oldPublicId)
    }

    // Update user profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: req.file.path },
      { new: true },
    ).select("-password")

    res.json({
      success: true,
      message: "Profile picture uploaded successfully",
      user: updatedUser,
      imageUrl: req.file.path,
    })
  } catch (error) {
    console.error("Profile upload error:", error)
    res.status(500).json({ message: "Upload failed" })
  }
})

// Upload menu item image
router.post("/menu-item", auth, menuUpload.single("menuImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    res.json({
      success: true,
      message: "Menu item image uploaded successfully",
      imageUrl: req.file.path,
      publicId: req.file.filename,
    })
  } catch (error) {
    console.error("Menu upload error:", error)
    res.status(500).json({ message: "Upload failed" })
  }
})

// Upload vendor images
router.post(
  "/vendor",
  auth,
  vendorUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files uploaded" })
      }

      const uploadedFiles = {}

      // Process each file type
      if (req.files.logo) {
        uploadedFiles.logo = req.files.logo[0].path
      }
      if (req.files.banner) {
        uploadedFiles.banner = req.files.banner[0].path
      }
      if (req.files.gallery) {
        uploadedFiles.gallery = req.files.gallery.map((file) => file.path)
      }

      res.json({
        success: true,
        message: "Vendor images uploaded successfully",
        files: uploadedFiles,
      })
    } catch (error) {
      console.error("Vendor upload error:", error)
      res.status(500).json({ message: "Upload failed" })
    }
  },
)

// Delete image
router.delete("/delete", auth, async (req, res) => {
  try {
    const { imageUrl } = req.body

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL required" })
    }

    const publicId = extractPublicId(imageUrl)
    const result = await deleteImage(publicId)

    res.json({
      success: true,
      message: "Image deleted successfully",
      result,
    })
  } catch (error) {
    console.error("Delete image error:", error)
    res.status(500).json({ message: "Delete failed" })
  }
})

module.exports = router
