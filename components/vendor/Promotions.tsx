"use client"

import { useState, useEffect } from "react"
import { Plus, Megaphone, Trash2, Loader2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import QRCode from "qrcode"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Printer, Download, QrCode, Utensils, Pizza, Coffee, Store, ChefHat, MapPin } from "lucide-react"
import dynamic from "next/dynamic"

interface Vendor {
  id: string
  shopName: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
  }
  images: {
    shop?: string | string[]
    logo?: string
  }
}


export default function Promotions() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "percentage",
    value: 0,
    minimumOrder: 0,
    validTill: "",
    usageLimit: 100,
  })

  // Poster Generator State
  const [vendorData, setVendorData] = useState<Vendor | null>(null)
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")

  useEffect(() => {
    fetchPromotions()
    fetchVendorProfile()
  }, [])

  const fetchVendorProfile = async () => {
    try {
      const response = await api.vendors.getProfile()
      if (response.success && response.vendor) {
        setVendorData(response.vendor)
      }
    } catch (err) {
      console.error("Failed to fetch vendor data for poster:", err)
    }
  }

  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const response = await api.vendors.getPromotions()
      if (response.success) {
        setPromotions(response.promotions)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch promotions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePromotion = async () => {
    if (!formData.title || !formData.value) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await api.vendors.createPromotion(formData)
      if (response.success) {
        toast({
          title: "Promotion Created",
          description: "Your new promotion is now live!",
        })
        setIsCreating(false)
        setFormData({
          title: "",
          description: "",
          type: "percentage",
          value: 0,
          minimumOrder: 0,
          validTill: "",
          usageLimit: 100,
        })
        fetchPromotions()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create promotion",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePromotion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return

    try {
      const response = await api.vendors.deletePromotion(id)
      if (response.success) {
        toast({
          title: "Promotion Deleted",
          description: "Offer has been removed",
        })
        fetchPromotions()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promotion",
        variant: "destructive",
      })
    }
  }

  const getPromotionTypeColor = (type: string) => {
    switch (type) {
      case "percentage": return "bg-green-100 text-green-800"
      case "buy_one_get_one": return "bg-blue-100 text-blue-800"
      case "fixed": return "bg-purple-100 text-purple-800"
      case "free_delivery": return "bg-amber-100 text-amber-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPromotionTypeText = (type: string) => {
    switch (type) {
      case "percentage": return "Percentage Off"
      case "buy_one_get_one": return "BOGO"
      case "fixed": return "Fixed Discount"
      case "free_delivery": return "Free Delivery"
      default: return type
    }
  }

  // --- Poster Handlers ---
  const handleGenerateQR = async () => {
    if (!vendorData?.id) {
      toast({
        title: "Error",
        description: "Vendor data not loaded",
        variant: "destructive"
      })
      return
    }
    try {
      // Use production domain or fallback
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : "https://streeteats-frontend-kw1c.vercel.app")
      const shopUrl = `${baseUrl}/vendor/${vendorData.id}`
      const url = await QRCode.toDataURL(shopUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#ea580c", // orange-600
          light: "#ffffff",
        },
      })
      setQrDataUrl(url)
      setIsGeneratorOpen(true)
    } catch (err) {
      console.error("QR generation failed:", err)
      toast({
        title: "QR Generation Failed",
        variant: "destructive"
      })
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById("marketing-poster")
    if (!printContent) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Marketing Poster - ${vendorData?.shopName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>@media print { body { padding: 0; margin: 0; } #poster-container { box-shadow: none !important; border: none !important; } }</style>
        </head>
        <body class="bg-white">
          <div id="poster-container" class="max-w-[800px] mx-auto p-10 mt-10 border-8 border-orange-500 rounded-[40px] shadow-2xl bg-white text-center">
            ${printContent.innerHTML}
          </div>
          <script>window.onload=()=>{window.print();}</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadImage = async () => {
    const posterElement = document.getElementById("marketing-poster")
    if (!posterElement) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(posterElement, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true })
      const link = document.createElement('a')
      link.download = `${vendorData?.shopName}-Poster.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast({ title: "Success", description: "Poster downloaded as image" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to download poster", variant: "destructive" })
    }
  }

  const handleDownloadPDF = async () => {
    const posterElement = document.getElementById("marketing-poster")
    if (!posterElement) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      const canvas = await html2canvas(posterElement, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`${vendorData?.shopName}-Poster.pdf`)
      toast({ title: "Success", description: "Poster downloaded as PDF" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Offers</h1>
          <p className="text-gray-600">Create and manage special offers for your customers</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-orange-200 bg-orange-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-orange-800">Create New Promotion</CardTitle>
            <CardDescription>Set up a special offer for your customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Offer Title *</label>
                <Input
                  placeholder="e.g., 20% Off Weekend Special"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Offer Type</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md bg-white h-10"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="buy_one_get_one">Buy One Get One</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Value *</label>
                <Input
                  type="number"
                  placeholder="20"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Order (₹)</label>
                <Input
                  type="number"
                  placeholder="200"
                  value={formData.minimumOrder || ""}
                  onChange={(e) => setFormData({ ...formData, minimumOrder: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valid Until</label>
                <Input
                  type="date"
                  value={formData.validTill}
                  onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Usage Limit</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Describe your offer to attract customers"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleCreatePromotion}
                className="bg-orange-500 hover:bg-orange-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Promotion
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {/* Marketing QR Section */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 text-orange-900">
                <QrCode className="h-5 w-5" />
                Boost Your Sales!
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Generate a custom QR code poster for your shop. Customers can scan to view your menu instantly!
              </p>
            </div>
            <Button
              onClick={handleGenerateQR}
              className="bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all hover:scale-105"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Generate Marketing QR
            </Button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Active Promotions</h2>

        {promotions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
            No active promotions. Create one to attract more customers!
          </div>
        ) : (
          promotions.map((promotion) => (
            <Card key={promotion._id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-orange-950">{promotion.title}</CardTitle>
                    <CardDescription className="text-orange-800">{promotion.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getPromotionTypeColor(promotion.type)} border-none shadow-sm`}>
                      {getPromotionTypeText(promotion.type)}
                    </Badge>
                    <Badge variant={promotion.isActive ? "default" : "secondary"} className={promotion.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                      {promotion.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="bg-orange-50/50 p-2 rounded-lg">
                    <p className="text-gray-600 text-xs">Discount</p>
                    <p className="font-bold text-lg text-orange-700">
                      {promotion.type === "percentage" ? `${promotion.value}%` : `₹${promotion.value}`}
                    </p>
                  </div>
                  <div className="bg-blue-50/50 p-2 rounded-lg">
                    <p className="text-gray-600 text-xs">Min Order</p>
                    <p className="font-bold text-lg text-blue-700">₹{promotion.minimumOrder || 0}</p>
                  </div>
                  <div className="bg-purple-50/50 p-2 rounded-lg">
                    <p className="text-gray-600 text-xs">Valid Until</p>
                    <p className="font-bold text-lg text-purple-700">
                      {promotion.validTill ? new Date(promotion.validTill).toLocaleDateString() : "No Limit"}
                    </p>
                  </div>
                  <div className="bg-green-50/50 p-2 rounded-lg">
                    <p className="text-gray-600 text-xs">Redeemed</p>
                    <p className="font-bold text-lg text-green-700">
                      {promotion.usedCount || 0} / {promotion.usageLimit || "∞"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeletePromotion(promotion._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Megaphone className="w-4 h-4 mr-2" />
                    Push to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 bg-orange-600 text-white shrink-0">
            <DialogTitle className="text-2xl font-bold">Marketing Poster</DialogTitle>
            <DialogDescription className="text-orange-100">
              Print this poster and place it at your shop or nearby locations.
            </DialogDescription>
          </DialogHeader>

          <div className="p-10 flex flex-col items-center overflow-y-auto flex-1 relative">
            {/* Background Decorative Icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] flex flex-wrap justify-around content-around p-10">
              <Utensils className="w-12 h-12 rotate-12" />
              <Pizza className="w-16 h-16 -rotate-12" />
              <Coffee className="w-10 h-10 rotate-45" />
              <Store className="w-14 h-14 -rotate-45" />
              <ChefHat className="w-12 h-12 rotate-12" />
              <Utensils className="w-16 h-16 -rotate-12" />
              <Pizza className="w-10 h-10 rotate-45" />
              <Coffee className="w-14 h-14 -rotate-45" />
            </div>

            <div
              id="marketing-poster"
              className="bg-white w-full max-w-[450px] flex flex-col items-center space-y-6 relative z-10"
            >
              {/* TOP: Branding & Shop Name */}
              <div className="text-center w-full space-y-4 pt-2">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center space-x-3">
                    <img src="/image.png" alt="Aahar Logo" className="w-12 h-12 object-contain" />
                    <span className="text-4xl font-black text-gray-900 tracking-tighter italic">Aahar</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Authentic Traditional Food Platform</p>
                </div>
                <h4 className="text-4xl font-black text-orange-600 tracking-tight leading-none pt-2">{vendorData?.shopName}</h4>
              </div>

              {/* NEXT: Larger Shop Image */}
              {(vendorData?.images?.shop?.[0] || vendorData?.images?.shop || vendorData?.images?.logo) && (
                <div className="w-48 h-48 overflow-hidden rounded-2xl shadow-lg border-4 border-white">
                  <img
                    src={
                      Array.isArray(vendorData?.images?.shop) && vendorData?.images?.shop.length > 0
                        ? vendorData.images.shop[0]
                        : (vendorData?.images?.shop as unknown as string) || vendorData?.images?.logo
                    }
                    alt={vendorData?.shopName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* MESSAGE */}
              <div className="text-center">
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Order Directly From Us!</h3>
                <p className="text-orange-600 font-bold">Scan to browse our menu</p>
              </div>

              {/* MIDDLE: Large QR Code */}
              <div className="p-6 bg-white border-[10px] border-orange-500 rounded-[40px] shadow-2xl">
                <img src={qrDataUrl} alt="Shop QR Code" className="w-80 h-80" />
              </div>

              {/* BOTTOM: Location */}
              <div className="text-center w-full">
                <div className="flex items-center justify-center text-gray-700 bg-gray-50 py-3 px-6 rounded-full border border-gray-100">
                  <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                  <span className="text-lg font-bold">{vendorData?.address.city}, {vendorData?.address.state}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-10 w-full justify-center">
              <Button onClick={handlePrint} className="bg-orange-600 hover:bg-orange-700">
                <Printer className="w-4 h-4 mr-2" />
                Print Poster
              </Button>
              <Button onClick={handleDownloadImage} variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                <Download className="w-4 h-4 mr-2" />
                Download as Image
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                <Download className="w-4 h-4 mr-2" />
                Download as PDF
              </Button>
              <a
                href={qrDataUrl}
                download={`${vendorData?.shopName}-QR.png`}
              >
                <Button variant="ghost" size="sm">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Only
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
