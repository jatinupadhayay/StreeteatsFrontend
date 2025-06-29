const nodemailer = require("nodemailer")
const fs = require("fs").promises
const path = require("path")

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Email templates
const emailTemplates = {
  orderConfirmation: {
    subject: "Order Confirmation - StreetEats",
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">Order Confirmed!</h2>
        <p>Hi {{customerName}},</p>
        <p>Your order has been confirmed and is being prepared.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> {{orderId}}</p>
          <p><strong>Vendor:</strong> {{vendorName}}</p>
          <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
          <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4>Items Ordered:</h4>
          {{itemsList}}
        </div>
        
        <p>You can track your order status in the app.</p>
        <p>Thank you for choosing StreetEats!</p>
      </div>
    `,
  },

  orderStatusUpdate: {
    subject: "Order Status Update - StreetEats",
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">Order Status Update</h2>
        <p>Hi {{customerName}},</p>
        <p>Your order status has been updated to: <strong>{{orderStatus}}</strong></p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order ID:</strong> {{orderId}}</p>
          <p><strong>Current Status:</strong> {{orderStatus}}</p>
          {{#if estimatedDelivery}}
          <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
          {{/if}}
        </div>
        
        <p>Thank you for your patience!</p>
      </div>
    `,
  },

  newOrderVendor: {
    subject: "New Order Received - StreetEats",
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">New Order Received!</h2>
        <p>Hi {{vendorName}},</p>
        <p>You have received a new order.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> {{orderId}}</p>
          <p><strong>Customer:</strong> {{customerName}}</p>
          <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
          <p><strong>Order Time:</strong> {{orderTime}}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4>Items:</h4>
          {{itemsList}}
        </div>
        
        <p>Please log in to your dashboard to accept and manage this order.</p>
      </div>
    `,
  },

  welcomeEmail: {
    subject: "Welcome to StreetEats!",
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">Welcome to StreetEats!</h2>
        <p>Hi {{userName}},</p>
        <p>Welcome to StreetEats - your gateway to delicious street food!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Get Started:</h3>
          <ul>
            <li>Explore local street food vendors</li>
            <li>Order your favorite dishes</li>
            <li>Track your orders in real-time</li>
            <li>Earn loyalty points with every order</li>
          </ul>
        </div>
        
        <p>Happy eating!</p>
        <p>The StreetEats Team</p>
      </div>
    `,
  },
}

// Helper function to replace template variables
const replaceTemplateVariables = (template, variables) => {
  let result = template
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g")
    result = result.replace(regex, variables[key] || "")
  })
  return result
}

// Send email function
const sendEmail = async (to, templateName, variables) => {
  try {
    const template = emailTemplates[templateName]
    if (!template) {
      throw new Error(`Template ${templateName} not found`)
    }

    const htmlContent = replaceTemplateVariables(template.template, variables)
    const subject = replaceTemplateVariables(template.subject, variables)

    const mailOptions = {
      from: `"StreetEats" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", result.messageId)
    return result
  } catch (error) {
    console.error("Email sending failed:", error)
    throw error
  }
}

// Specific email functions
const sendOrderConfirmation = async (customerEmail, orderData) => {
  const itemsList = orderData.items
    .map((item) => `<p>• ${item.name} x ${item.quantity} - ₹${item.price * item.quantity}</p>`)
    .join("")

  return sendEmail(customerEmail, "orderConfirmation", {
    customerName: orderData.customerName,
    orderId: orderData.orderId,
    vendorName: orderData.vendorName,
    totalAmount: orderData.totalAmount,
    estimatedDelivery: orderData.estimatedDelivery,
    itemsList: itemsList,
  })
}

const sendOrderStatusUpdate = async (customerEmail, orderData) => {
  return sendEmail(customerEmail, "orderStatusUpdate", {
    customerName: orderData.customerName,
    orderId: orderData.orderId,
    orderStatus: orderData.status,
    estimatedDelivery: orderData.estimatedDelivery,
  })
}

const sendNewOrderToVendor = async (vendorEmail, orderData) => {
  const itemsList = orderData.items.map((item) => `<p>• ${item.name} x ${item.quantity}</p>`).join("")

  return sendEmail(vendorEmail, "newOrderVendor", {
    vendorName: orderData.vendorName,
    orderId: orderData.orderId,
    customerName: orderData.customerName,
    totalAmount: orderData.totalAmount,
    orderTime: new Date(orderData.createdAt).toLocaleString(),
    itemsList: itemsList,
  })
}

const sendWelcomeEmail = async (userEmail, userData) => {
  return sendEmail(userEmail, "welcomeEmail", {
    userName: userData.name,
  })
}

// Test email configuration
const testEmailConnection = async () => {
  try {
    await transporter.verify()
    console.log("Email service is ready")
    return true
  } catch (error) {
    console.error("Email service error:", error)
    return false
  }
}

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendNewOrderToVendor,
  sendWelcomeEmail,
  testEmailConnection,
}
