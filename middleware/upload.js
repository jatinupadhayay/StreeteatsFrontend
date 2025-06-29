const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const cloudinary = require("cloudinary").v2

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure storage for different file types
const createStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `streeteats/${folder}`,
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [{ width: 800, height: 600, crop: "limit" }, { quality: "auto" }],
    },
  })
}

// Different upload configurations
const profileUpload = multer({
  storage: createStorage("profiles"),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
})

const menuUpload = multer({
  storage: createStorage("menu-items"),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
})

const vendorUpload = multer({
  storage: createStorage("vendors"),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
})

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error("Error deleting image:", error)
    throw error
  }
}

// Extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  const parts = url.split("/")
  const filename = parts[parts.length - 1]
  return filename.split(".")[0]
}

module.exports = {
  profileUpload,
  menuUpload,
  vendorUpload,
  deleteImage,
  extractPublicId,
  cloudinary,
}
